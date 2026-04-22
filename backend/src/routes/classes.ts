import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../lib/prisma';
import crypto from 'crypto';

const router = Router();

let classesStore: Array<{
  id: string;
  name: string;
  level: string;
  capacity: number;
  currentStudents: number;
  academicYear: string;
  mainTeacherId?: string;
  mainTeacher?: string;
}> = [];

router.use(authenticate);

router.get('/', (req: any, res) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole === 'TEACHER' && userId) {
    const filtered = classesStore.filter((item) => item.mainTeacherId === userId);
    res.json({ success: true, data: filtered });
    return;
  }

  res.json({ success: true, data: classesStore });
});

router.get('/:classId/notes-summary', async (req: any, res) => {
  const { classId } = req.params;
  const classItem = classesStore.find((item) => item.id === classId);

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

  const teacherProfile = await prisma.teacher.findUnique({
    where: { userId: classItem.mainTeacherId },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  });

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
      teacherName: teacherProfile.user ? `${teacherProfile.user.firstName} ${teacherProfile.user.lastName}` : classItem.mainTeacher,
      academicYear: classItem.academicYear,
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

router.post('/', authorize(['ADMIN']), async (req, res) => {
  const {
    name,
    level,
    capacity,
    currentStudents = 0,
    academicYear,
    mainTeacherId,
    mainTeacher
  } = req.body;

  if (!name || !level || !academicYear) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  let resolvedTeacherName = mainTeacher;
  if (mainTeacherId) {
    const existingAssignment = classesStore.find((item) => item.mainTeacherId === mainTeacherId);
    if (existingAssignment) {
      res.status(400).json({ success: false, error: 'Cet enseignant est deja assigne a une autre classe' });
      return;
    }

    const teacherUser = await prisma.user.findUnique({
      where: { id: mainTeacherId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });
    if (!teacherUser || teacherUser.role !== 'TEACHER') {
      res.status(400).json({ success: false, error: 'Enseignant principal invalide' });
      return;
    }
    resolvedTeacherName = [teacherUser.firstName, teacherUser.lastName].filter(Boolean).join(' ').trim();
  }

  const newClass = {
    id: crypto.randomUUID(),
    name,
    level,
    capacity: Number(capacity) || 0,
    currentStudents: Number(currentStudents) || 0,
    academicYear,
    mainTeacherId,
    mainTeacher: resolvedTeacherName
  };

  classesStore = [newClass, ...classesStore];
  res.status(201).json({ success: true, data: newClass });
});

router.put('/:classId', authorize(['ADMIN']), async (req, res) => {
  const { classId } = req.params;
  const index = classesStore.findIndex(item => item.id === classId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  const incomingTeacherId = req.body.mainTeacherId;
  let resolvedTeacherName = req.body.mainTeacher;

  if (incomingTeacherId) {
    const existingAssignment = classesStore.find((item) => item.id !== classId && item.mainTeacherId === incomingTeacherId);
    if (existingAssignment) {
      res.status(400).json({ success: false, error: 'Cet enseignant est deja assigne a une autre classe' });
      return;
    }

    const teacherUser = await prisma.user.findUnique({
      where: { id: incomingTeacherId },
      select: { id: true, role: true, firstName: true, lastName: true }
    });
    if (!teacherUser || teacherUser.role !== 'TEACHER') {
      res.status(400).json({ success: false, error: 'Enseignant principal invalide' });
      return;
    }
    resolvedTeacherName = [teacherUser.firstName, teacherUser.lastName].filter(Boolean).join(' ').trim();
  }

  if (incomingTeacherId === '') {
    resolvedTeacherName = '';
  }

  const updated = {
    ...classesStore[index],
    ...req.body,
    capacity: req.body.capacity != null ? Number(req.body.capacity) : classesStore[index].capacity,
    currentStudents: req.body.currentStudents != null ? Number(req.body.currentStudents) : classesStore[index].currentStudents,
    mainTeacherId: incomingTeacherId === '' ? '' : (incomingTeacherId ?? classesStore[index].mainTeacherId),
    mainTeacher: resolvedTeacherName ?? classesStore[index].mainTeacher
  };

  classesStore[index] = updated;
  res.json({ success: true, data: updated });
});

router.delete('/:classId', authorize(['ADMIN']), (req, res) => {
  const { classId } = req.params;
  const existing = classesStore.find(item => item.id === classId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  classesStore = classesStore.filter(item => item.id !== classId);
  res.json({ success: true });
});

export default router;
