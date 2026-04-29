import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

type ScheduleRequestStatus = 'PENDING_APPROVAL' | 'REJECTED' | 'PUBLISHED';

type PendingScheduleRequest = {
  id: string;
  courseId: string;
  teacherId: string;
  classroom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  semester: string;
  year: number;
  status: ScheduleRequestStatus;
  createdByUserId: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedByUserId?: string;
  rejectionReason?: string;
  publishedScheduleId?: string;
};

const pendingScheduleRequests: PendingScheduleRequest[] = [];

const overlaps = (startA: string, endA: string, startB: string, endB: string) => {
  return startA < endB && startB < endA;
};

const checkScheduleConflicts = async (input: {
  teacherId: string;
  classroom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) => {
  const conflicts = await prisma.schedule.findMany({
    where: {
      isActive: true,
      dayOfWeek: input.dayOfWeek,
      OR: [
        { teacherId: input.teacherId },
        { classroom: input.classroom }
      ]
    },
    select: {
      id: true,
      teacherId: true,
      classroom: true,
      startTime: true,
      endTime: true,
      course: {
        select: {
          code: true,
          name: true
        }
      }
    }
  });

  const conflict = conflicts.find((item) => overlaps(item.startTime, item.endTime, input.startTime, input.endTime));
  return conflict || null;
};

export const getStudentSchedule = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.query;

    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.id }
      });
      if (!student || student.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user!.id },
        include: { parentStudents: true }
      });
      
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        enrollments: {
          where: {
            status: 'ENROLLED',
            ...(semester && year && {
              course: {
                semester: semester as string,
                year: parseInt(year as string)
              }
            })
          },
          include: {
            course: {
              include: {
                schedules: {
                  where: { isActive: true },
                  include: {
                    teacher: {
                      include: {
                        user: {
                          select: { firstName: true, lastName: true }
                        }
                      }
                    }
                  },
                  orderBy: { dayOfWeek: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    const weeklySchedule: { [key: number]: any[] } = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    };

    let totalCredits = 0;

    student.enrollments.forEach(enrollment => {
      totalCredits += enrollment.course.credits;
      enrollment.course.schedules.forEach(schedule => {
        weeklySchedule[schedule.dayOfWeek].push({
          scheduleId: schedule.id,
          courseId: enrollment.course.id,
          courseCode: enrollment.course.code,
          courseName: enrollment.course.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.classroom,
          teacher: schedule.teacher?.user ? 
            `${schedule.teacher.user.firstName} ${schedule.teacher.user.lastName}` : null,
          credits: enrollment.course.credits
        });
      });
    });

    const dayNames = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    res.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        semester: semester || 'Actuel',
        year: year || new Date().getFullYear(),
        weeklySchedule: Object.entries(weeklySchedule).reduce((acc, [day, schedules]) => {
          acc[dayNames[parseInt(day)]] = schedules.sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
          );
          return acc;
        }, {} as any),
        totalCredits
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get student schedule error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getTeacherSchedule = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { teacherId } = req.params;

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      if (!teacher || teacher.id !== teacherId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        schedules: {
          where: { isActive: true },
          include: {
            course: true
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Enseignant non trouvé'
      });
    }

    const weeklySchedule: { [key: number]: any[] } = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
    };

    teacher.schedules.forEach(schedule => {
      weeklySchedule[schedule.dayOfWeek].push({
        scheduleId: schedule.id,
        courseId: schedule.course.id,
        courseCode: schedule.course.code,
        courseName: schedule.course.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.classroom,
        enrolledStudents: (schedule.course as any).enrollments?.length || 0
      });
    });

    const dayNames = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    res.json({
      success: true,
      data: {
        teacherId: teacher.id,
        teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
        officeHours: teacher.officeHours,
        teachingSchedule: Object.entries(weeklySchedule).reduce((acc, [day, schedules]) => {
          acc[dayNames[parseInt(day)]] = schedules;
          return acc;
        }, {} as any)
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get teacher schedule error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const createSchedule = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { courseId, teacherId, classroom, dayOfWeek, startTime, endTime, semester, year } = req.body;

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      if (!teacher || teacher.id !== teacherId) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    if (req.user!.role === 'TEACHER') {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, code: true, name: true, teacherId: true }
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Cours non trouvé' });
      }

      if (course.teacherId !== teacherId) {
        return res.status(403).json({ success: false, error: 'Accès refusé pour ce cours' });
      }

      const requestId = `schedreq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const requestItem: PendingScheduleRequest = {
        id: requestId,
        courseId,
        teacherId,
        classroom,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        semester,
        year: Number(year),
        status: 'PENDING_APPROVAL',
        createdByUserId: req.user!.id,
        createdAt: new Date()
      };

      pendingScheduleRequests.unshift(requestItem);

      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true }
      });

      if (admins.length > 0) {
        await prisma.message.createMany({
          data: admins.map((admin) => ({
            senderId: req.user!.id,
            receiverId: admin.id,
            subject: 'Nouvelle demande d\'emploi du temps',
            content: `Demande en attente: ${course.code} ${course.name} (${startTime}-${endTime}, salle ${classroom}).`
          }))
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Demande envoyée pour approbation admin',
        data: {
          requestId,
          status: 'PENDING_APPROVAL'
        }
      });
    }

    const conflict = await checkScheduleConflicts({
      teacherId,
      classroom,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Conflit d'horaire avec ${conflict.course.code} (${conflict.startTime}-${conflict.endTime})`
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId,
        teacherId,
        classroom,
        dayOfWeek,
        startTime,
        endTime,
        semester,
        year
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Horaire créé avec succès',
      data: schedule
    });
  } catch (error) {
    logger.error({ error }, 'Create schedule error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getScheduleSummary = async (_req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const totalSchedules = await prisma.schedule.count();
    const activeSchedules = await prisma.schedule.count({ where: { isActive: true } });
    const activeCourseRows = await prisma.schedule.findMany({
      where: { isActive: true },
      select: { courseId: true }
    });
    const classesCovered = new Set(activeCourseRows.map((row) => row.courseId)).size;

    res.json({
      success: true,
      data: {
        published: activeSchedules,
        classesCovered,
        pending: pendingScheduleRequests.filter((item) => item.status === 'PENDING_APPROVAL').length,
        archived: Math.max(totalSchedules - activeSchedules, 0)
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get schedule summary error:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateSchedule = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { scheduleId } = req.params;
    const { classroom, startTime, endTime, isActive } = req.body;

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { course: true }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Horaire non trouvé'
      });
    }

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!teacher || existingSchedule.teacherId !== teacher.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        classroom: classroom || existingSchedule.classroom,
        startTime: startTime || existingSchedule.startTime,
        endTime: endTime || existingSchedule.endTime,
        isActive: isActive !== undefined ? isActive : existingSchedule.isActive
      },
      include: {
        course: true,
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Horaire mis à jour avec succès',
      data: schedule
    });
  } catch (error) {
    logger.error({ error }, 'Update schedule error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const deleteSchedule = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { scheduleId } = req.params;

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Horaire non trouvé'
      });
    }

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      
      if (!teacher || existingSchedule.teacherId !== teacher.id) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé'
        });
      }
    }

    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    res.json({
      success: true,
      message: 'Horaire supprimé avec succès'
    });
  } catch (error) {
    logger.error({ error }, 'Delete schedule error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const listScheduleRequests = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!role || !userId) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    if (role === 'ADMIN') {
      return res.json({ success: true, data: pendingScheduleRequests });
    }

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return res.status(404).json({ success: false, error: 'Profil enseignant introuvable' });
      }

      const own = pendingScheduleRequests.filter((item) => item.teacherId === teacher.id);
      return res.json({ success: true, data: own });
    }

    return res.status(403).json({ success: false, error: 'Accès refusé' });
  } catch (error) {
    logger.error({ error }, 'List schedule requests error:');
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const reviewScheduleRequest = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { requestId } = req.params;
    const { action, reason } = req.body as { action?: 'APPROVE' | 'REJECT'; reason?: string };

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action invalide' });
    }

    const requestItem = pendingScheduleRequests.find((item) => item.id === requestId);
    if (!requestItem) {
      return res.status(404).json({ success: false, error: 'Demande introuvable' });
    }

    if (requestItem.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, error: 'Demande déjà traitée' });
    }

    const course = await prisma.course.findUnique({
      where: { id: requestItem.courseId },
      select: {
        id: true,
        code: true,
        name: true,
        enrollments: {
          select: {
            student: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: { firstName: true, lastName: true }
                },
                parentStudents: {
                  include: {
                    parent: {
                      select: { userId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Cours introuvable' });
    }

    const teacherUser = await prisma.teacher.findUnique({
      where: { id: requestItem.teacherId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!teacherUser?.user?.id) {
      return res.status(404).json({ success: false, error: 'Enseignant introuvable' });
    }

    if (action === 'REJECT') {
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ success: false, error: 'Le motif de refus est requis' });
      }

      requestItem.status = 'REJECTED';
      requestItem.rejectionReason = reason.trim();
      requestItem.reviewedAt = new Date();
      requestItem.reviewedByUserId = req.user!.id;

      await prisma.message.create({
        data: {
          senderId: req.user!.id,
          receiverId: teacherUser.user.id,
          subject: 'Demande d\'emploi du temps refusée',
          content: `Votre demande pour ${course.code} ${course.name} a été refusée. Motif: ${reason.trim()}`
        }
      });

      return res.json({ success: true, message: 'Demande refusée', data: requestItem });
    }

    const conflict = await checkScheduleConflicts({
      teacherId: requestItem.teacherId,
      classroom: requestItem.classroom,
      dayOfWeek: requestItem.dayOfWeek,
      startTime: requestItem.startTime,
      endTime: requestItem.endTime
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Conflit d'horaire avec ${conflict.course.code} (${conflict.startTime}-${conflict.endTime})`
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId: requestItem.courseId,
        teacherId: requestItem.teacherId,
        classroom: requestItem.classroom,
        dayOfWeek: requestItem.dayOfWeek,
        startTime: requestItem.startTime,
        endTime: requestItem.endTime,
        semester: requestItem.semester,
        year: requestItem.year,
        isActive: true
      }
    });

    requestItem.status = 'PUBLISHED';
    requestItem.reviewedAt = new Date();
    requestItem.reviewedByUserId = req.user!.id;
    requestItem.publishedScheduleId = schedule.id;

    await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId: teacherUser.user.id,
        subject: 'Demande d\'emploi du temps approuvée',
        content: `Votre demande pour ${course.code} ${course.name} a été approuvée et publiée.`
      }
    });

    const studentMessages = course.enrollments
      .map((item) => item.student)
      .filter((student) => !!student.userId)
      .map((student) => ({
        senderId: req.user!.id,
        receiverId: student.userId,
        subject: 'Mise à jour de votre emploi du temps',
        content: `Nouveau créneau publié pour ${course.code} ${course.name}: ${requestItem.startTime}-${requestItem.endTime}, salle ${requestItem.classroom}.`
      }));

    if (studentMessages.length > 0) {
      await prisma.message.createMany({ data: studentMessages });
    }

    return res.json({
      success: true,
      message: 'Demande approuvée et emploi du temps publié',
      data: {
        request: requestItem,
        scheduleId: schedule.id
      }
    });
  } catch (error) {
    logger.error({ error }, 'Review schedule request error:');
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};