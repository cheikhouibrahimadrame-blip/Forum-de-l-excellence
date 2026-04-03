import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';


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

    res.status(201).json({
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
        pending: Math.max(totalSchedules - activeSchedules, 0)
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