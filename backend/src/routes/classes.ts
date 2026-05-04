import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

type ClassItem = {
  id: string;
  name: string;
  level: string;
  capacity: number;
  currentStudents: number;
  academicYear: string;
  mainTeacherId?: string;
  mainTeacher?: string;
};

router.use(authenticate);

router.get('/', async (req: any, res) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;

  try {
    const whereClause = (userRole === 'TEACHER' && userId) ? { mainTeacherId: userId } : {};
    const classes = await (prisma as any).class.findMany({ where: whereClause, orderBy: { name: 'asc' } });

    // Batch-resolve teacher names
    const teacherIds = classes.map((c: any) => c.mainTeacherId).filter(Boolean);
    const teacherUsers = teacherIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, firstName: true, lastName: true }
        })
      : [];
    const teacherMap = new Map(teacherUsers.map(t => [t.id, [t.firstName, t.lastName].filter(Boolean).join(' ')]));

    const mapped: ClassItem[] = [];
    for (const c of classes) {
      const currentStudents = await prisma.student.count({ where: { major: c.name } });
      mapped.push({
        id: c.id,
        name: c.name,
        level: c.level || '',
        capacity: c.capacity || 0,
        currentStudents,
        academicYear: c.academicYearId || '',
        mainTeacherId: c.mainTeacherId || undefined,
        mainTeacher: teacherMap.get(c.mainTeacherId) || ''
      });
    }
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des classes' });
  }
});

router.get('/teacher/students', async (req: any, res) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole !== 'TEACHER') {
    res.status(403).json({ success: false, error: 'Acces reserve aux enseignants' });
    return;
  }

  try {
      const assignedClasses = await (prisma as any).class.findMany({ where: { mainTeacherId: userId } });
    if (assignedClasses.length === 0) {
      res.json({ success: true, data: { students: [], classes: [] } });
      return;
    }

    const classNames = assignedClasses.map((item: any) => item.name);

    const students = await prisma.student.findMany({
      where: { major: { in: classNames } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true } } },
      orderBy: { user: { lastName: 'asc' } }
    });

    const payload = students.filter((s) => !!s.user).map((student) => ({
      id: student.user.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone || '',
      className: student.major || '',
      level: String(student.status || ''),
      average: student.gpa != null ? Number(student.gpa) : null,
      attendance: null,
      isActive: student.user.isActive
    }));

    const assignedClassesPayload = assignedClasses.map((c: any) => ({ id: c.id, name: c.name }));
    res.json({ success: true, data: { students: payload, classes: assignedClassesPayload } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des eleves' });
  }
});

router.post('/:classId/students/assign', authorize(['ADMIN']), async (req: any, res) => {
  const { classId } = req.params;
  const studentUserIds: string[] = Array.isArray(req.body?.studentUserIds)
    ? req.body.studentUserIds.map((id: unknown) => String(id ?? '').trim()).filter((id: string) => id.length > 0)
    : [];

  const classItem = await prisma.class.findUnique({ where: { id: classId } });
  if (!classItem) {
    res.status(404).json({ success: false, error: 'Classe introuvable' });
    return;
  }

  if (studentUserIds.length === 0) {
    const currentClassStudentCount = await prisma.student.count({ where: { major: classItem.name } });
    res.json({ success: true, data: { assignedCount: 0, classId, currentStudents: currentClassStudentCount } });
    return;
  }

  const uniqueValidUserIds = Array.from(new Set<string>(studentUserIds));

  const selectedStudentUsers = await prisma.user.findMany({ where: { id: { in: uniqueValidUserIds }, role: 'STUDENT' }, select: { id: true } });
  const selectedStudentUserIds = selectedStudentUsers.map((u) => u.id);

  if (selectedStudentUserIds.length > 0) {
    const existingProfiles = await prisma.student.findMany({ where: { userId: { in: selectedStudentUserIds } }, select: { userId: true } });
    const existingUserIds = new Set(existingProfiles.map((p) => p.userId));
    const missingProfileUserIds = selectedStudentUserIds.filter((userId) => !existingUserIds.has(userId));

    for (const userId of missingProfileUserIds) {
      const compactUserId = userId.replace(/-/g, '');
      const generatedStudentId = `STU-${compactUserId.slice(0, 10)}${compactUserId.slice(-6)}`;
      try {
        await prisma.student.create({ data: { userId, studentId: generatedStudentId, dateOfBirth: new Date(), enrollmentDate: new Date() } });
      } catch {
        // ignore
      }
    }
  }

  const studentsToAssign = await prisma.student.findMany({ where: { userId: { in: selectedStudentUserIds } }, select: { id: true, userId: true } });
  const assignedUserIds = studentsToAssign.map((s) => s.userId);
  const invalidUserIds = uniqueValidUserIds.filter((id: string) => !assignedUserIds.includes(id));

  if (studentsToAssign.length === 0) {
    const currentClassStudentCount = await prisma.student.count({ where: { major: classItem.name } });
    res.json({ success: true, data: { classId, className: classItem.name, assignedCount: 0, assignedUserIds: [], invalidUserIds, currentStudents: currentClassStudentCount } });
    return;
  }

    await (prisma as any).student.updateMany({ where: { id: { in: studentsToAssign.map((s) => s.id) } }, data: { major: classItem.name } });

  const currentClassStudentCount = await prisma.student.count({ where: { major: classItem.name } });

  res.json({ success: true, data: { classId, className: classItem.name, assignedCount: studentsToAssign.length, assignedUserIds, invalidUserIds, currentStudents: currentClassStudentCount } });
});

router.get('/:classId/notes-summary', async (req: any, res) => {
  const { classId } = req.params;
  const classItem = await prisma.class.findUnique({ where: { id: classId } });

  if (!classItem) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole === 'TEACHER' && classItem.mainTeacherId !== userId) {
    res.status(403).json({ success: false, error: 'Acces refuse pour cette classe' });
    return;
  }

  if (!classItem.mainTeacherId) {
    res.status(400).json({ success: false, error: 'Aucun enseignant principal assigne' });
    return;
  }

  const teacherProfile = await prisma.teacher.findUnique({ where: { userId: classItem.mainTeacherId }, include: { user: { select: { firstName: true, lastName: true, email: true } } } });

  if (!teacherProfile) {
    res.status(404).json({ success: false, error: 'Profil enseignant introuvable' });
    return;
  }

  const courses = await prisma.course.findMany({
    where: {
      teacherId: teacherProfile.id,
      isActive: true
    },
    include: {
      enrollments: {
        select: { studentId: true }
      },
      grades: {
        select: {
          id: true,
          studentId: true,
          pointsEarned: true,
          pointsPossible: true,
          gradeDate: true
        },
        orderBy: { gradeDate: 'desc' }
      }
    }
  });

  const grades = courses.flatMap((course) => course.grades.map((grade) => ({
    ...grade,
    courseId: course.id,
    courseName: course.name,
    courseCode: course.code
  })));

  const uniqueStudents = new Set<string>();
  const gradedStudents = new Set<string>();
  let totalWeightedScore = 0;
  let totalPossibleScore = 0;
  let latestGradeDateIso: string | null = null;

  courses.forEach((course) => {
    course.enrollments.forEach((enrollment) => {
      uniqueStudents.add(enrollment.studentId);
    });
  });

  grades.forEach((grade) => {
    gradedStudents.add(grade.studentId);
    totalWeightedScore += Number(grade.pointsEarned);
    totalPossibleScore += Number(grade.pointsPossible);
    const gradeDate = new Date(grade.gradeDate as any);
    if (!latestGradeDateIso || gradeDate > new Date(latestGradeDateIso)) {
      latestGradeDateIso = gradeDate.toISOString();
    }
  });

  const average = totalPossibleScore > 0
    ? Math.round(((totalWeightedScore / totalPossibleScore) * 20) * 10) / 10
    : 0;

  const coverage = uniqueStudents.size > 0
    ? Math.round((gradedStudents.size / uniqueStudents.size) * 100)
    : 0;

  const courseSummaries = courses.map((course) => {
    const courseTotalEarned = course.grades.reduce((sum, grade) => sum + Number(grade.pointsEarned), 0);
    const courseTotalPossible = course.grades.reduce((sum, grade) => sum + Number(grade.pointsPossible), 0);
    const courseAverage = courseTotalPossible > 0
      ? Math.round(((courseTotalEarned / courseTotalPossible) * 20) * 10) / 10
      : 0;

    return {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      average: courseAverage,
      notesCount: course.grades.length
    };
  }).sort((a, b) => b.average - a.average);

  const topCourse = courseSummaries[0] || null;
  const mastery = average >= 16 ? 'Très solide' : average >= 14 ? 'Satisfaisante' : 'En consolidation';
  const trend = average >= 14 ? 'En progression' : average >= 12 ? 'Stable' : 'À renforcer';

  res.json({
    success: true,
    data: {
      classId: classItem.id,
      className: classItem.name,
      teacherName: teacherProfile.user ? `${teacherProfile.user.firstName} ${teacherProfile.user.lastName}` : '',
      academicYear: classItem.academicYearId || '',
      average,
      mastery,
      trend,
      notesCount: grades.length,
      coursesCount: courses.length,
      studentsCount: uniqueStudents.size,
      gradedStudentsCount: gradedStudents.size,
      coverage,
      lastGradeDate: latestGradeDateIso,
      topCourse,
      courses: courseSummaries,
      remark: grades.length > 0
        ? `Synthèse réelle basée sur ${grades.length} note(s) enregistrée(s) dans ${courses.length} cours.`
        : 'Aucune note disponible pour cette classe pour le moment.'
    }
  });
});

router.post('/:classId/announce', authorize(['TEACHER', 'ADMIN']), async (req: any, res) => {
  const { classId } = req.params;
  const { title, content } = req.body || {};

  if (!title || !String(title).trim() || !content || !String(content).trim()) {
    res.status(400).json({ success: false, error: 'Titre et contenu requis' });
    return;
  }

  const classItem = await prisma.class.findUnique({ where: { id: classId } });
  if (!classItem) {
    res.status(404).json({ success: false, error: 'Classe introuvable' });
    return;
  }

  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole === 'TEACHER' && classItem.mainTeacherId !== userId) {
    res.status(403).json({ success: false, error: 'Acces refuse pour cette classe' });
    return;
  }

  const students = await prisma.student.findMany({
    where: {
      major: classItem.name
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      parentStudents: {
        include: {
          parent: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  const studentMessages = students
    .filter((student) => !!student.userId)
    .map((student) => ({
      senderId: userId,
      receiverId: student.userId,
      subject: `[Annonce ${classItem.name}] ${String(title).trim()}`,
      content: String(content).trim()
    }));

  const parentMessages = students.flatMap((student) => {
    const childName = [student.user?.firstName, student.user?.lastName].filter(Boolean).join(' ').trim();
    return student.parentStudents
      .filter((link) => !!link.parent?.userId)
      .map((link) => ({
        senderId: userId,
        receiverId: link.parent!.userId,
        subject: `[Annonce ${classItem.name}] ${String(title).trim()}`,
        content: `${String(content).trim()}\n\nEnfant concerné: ${childName || 'N/A'} • Classe: ${classItem.name}`
      }));
  });

  const allMessages = [...studentMessages, ...parentMessages];
  if (allMessages.length > 0) {
    await prisma.message.createMany({ data: allMessages });
  }

  res.status(201).json({
    success: true,
    data: {
      classId,
      title: String(title).trim(),
      recipients: {
        students: studentMessages.length,
        parents: parentMessages.length,
        total: allMessages.length
      }
    }
  });
});

router.post('/', authorize(['ADMIN']), async (req, res) => {
  const {
    name,
    level,
    capacity,
    currentStudents = 0,
    academicYear: academicYearInput,
    mainTeacherId,
    mainTeacher
  } = req.body;

  const missingFields: string[] = [];
  if (!name || !String(name).trim()) missingFields.push('nom de la classe');
  if (!level || !String(level).trim()) missingFields.push('niveau');

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: `Champs requis manquants : ${missingFields.join(', ')}`
    });
    return;
  }

  // If the admin did not select an academic year, fall back to the active one,
  // then the most recently created. This keeps the form usable even when the
  // year dropdown is skipped, and works hand-in-hand with the auto-seed in
  // GET /api/academic-years.
  let academicYear: string | null = academicYearInput ? String(academicYearInput) : null;
  if (!academicYear) {
    const active = await (prisma as any).academicYear.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    const fallback = active || await (prisma as any).academicYear.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    if (!fallback) {
      res.status(400).json({
        success: false,
        error: 'Aucune année scolaire disponible. Créez-en une depuis « Années scolaires ».'
      });
      return;
    }
    academicYear = String(fallback.id);
  }

  // Verify teacher assignment uniqueness and teacher validity
  if (mainTeacherId) {
    const existingAssignment = await prisma.class.findFirst({ where: { mainTeacherId } });
    if (existingAssignment) {
      res.status(400).json({ success: false, error: 'Cet enseignant est deja assigne a une autre classe' });
      return;
    }

    const teacherUser = await prisma.user.findUnique({ where: { id: mainTeacherId }, select: { id: true, role: true, firstName: true, lastName: true } });
    if (!teacherUser || teacherUser.role !== 'TEACHER') {
      res.status(400).json({ success: false, error: 'Enseignant principal invalide' });
      return;
    }
  }

  // Validate academicYear is a valid UUID if provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (academicYear && !uuidRegex.test(academicYear)) {
    res.status(400).json({ success: false, error: 'Format d\'année scolaire invalide. Utilisez l\'identifiant UUID.' });
    return;
  }

  try {
      const created = await (prisma as any).class.create({ data: {
      name: String(name).trim(),
      level: String(level),
      capacity: capacity != null ? Number(capacity) : 0,
      mainTeacherId: mainTeacherId || null,
      academicYearId: academicYear || null
    } });

    res.status(201).json({ success: true, data: {
      id: created.id,
      name: created.name,
      level: created.level || '',
      capacity: created.capacity || 0,
      currentStudents: await prisma.student.count({ where: { major: created.name } }),
      academicYear: created.academicYearId || '',
      mainTeacherId: created.mainTeacherId || undefined,
      mainTeacher: ''
    } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la creation de la classe' });
  }
});

router.put('/:classId', authorize(['TEACHER', 'ADMIN']), async (req: any, res) => {
  const { classId } = req.params;
  const isTeacher = req.user?.role === 'TEACHER';

  const existingClass = await prisma.class.findUnique({ where: { id: classId } });
  if (!existingClass) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  if (isTeacher && existingClass.mainTeacherId !== req.user?.id) {
    res.status(403).json({ success: false, error: 'Acces refuse pour cette classe' });
    return;
  }

  const incomingTeacherId = req.body.mainTeacherId;

  if (isTeacher) {
    const allowedKeys = ['name', 'capacity'];
    const forbiddenKeys = ['level', 'academicYear', 'mainTeacherId', 'mainTeacher', 'currentStudents'];
    const hasForbidden = forbiddenKeys.some((key) => req.body[key] !== undefined);
    if (hasForbidden) {
      res.status(403).json({ success: false, error: 'Les enseignants ne peuvent modifier que les informations générales de la classe' });
      return;
    }

      const updated = await (prisma as any).class.update({ where: { id: classId }, data: { name: req.body.name !== undefined ? String(req.body.name).trim() : existingClass.name, capacity: req.body.capacity != null ? Number(req.body.capacity) : existingClass.capacity } });
    res.json({ success: true, data: { id: updated.id, name: updated.name, level: updated.level || '', capacity: updated.capacity || 0, currentStudents: await prisma.student.count({ where: { major: updated.name } }), academicYear: updated.academicYearId || '', mainTeacherId: updated.mainTeacherId || undefined, mainTeacher: '' } });
    return;
  }

  if (incomingTeacherId) {
    const existingAssignment = await prisma.class.findFirst({ where: { mainTeacherId: incomingTeacherId, NOT: { id: classId } } as any });
    if (existingAssignment) {
      res.status(400).json({ success: false, error: 'Cet enseignant est deja assigne a une autre classe' });
      return;
    }

    const teacherUser = await prisma.user.findUnique({ where: { id: incomingTeacherId }, select: { id: true, role: true, firstName: true, lastName: true } });
    if (!teacherUser || teacherUser.role !== 'TEACHER') {
      res.status(400).json({ success: false, error: 'Enseignant principal invalide' });
      return;
    }
  }

  try {
    const dataToUpdate: any = {};
    if (req.body.name !== undefined) dataToUpdate.name = String(req.body.name).trim();
    if (req.body.level !== undefined) dataToUpdate.level = String(req.body.level);
    if (req.body.capacity !== undefined) dataToUpdate.capacity = Number(req.body.capacity);
    if (req.body.currentStudents !== undefined) {
      // currentStudents is derived from students; ignore direct set
    }
    if (incomingTeacherId !== undefined) {
      dataToUpdate.mainTeacherId = incomingTeacherId === '' ? null : incomingTeacherId;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      res.json({ success: true, data: existingClass });
      return;
    }

      const updated = await (prisma as any).class.update({ where: { id: classId }, data: dataToUpdate });
    res.json({ success: true, data: { id: updated.id, name: updated.name, level: updated.level || '', capacity: updated.capacity || 0, currentStudents: await prisma.student.count({ where: { major: updated.name } }), academicYear: updated.academicYearId || '', mainTeacherId: updated.mainTeacherId || undefined, mainTeacher: '' } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la mise a jour de la classe' });
  }
});

router.delete('/:classId', authorize(['ADMIN']), async (req, res) => {
  const { classId } = req.params;
  try {
    const existing = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }
      await (prisma as any).class.delete({ where: { id: classId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la classe' });
  }
});

export default router;
