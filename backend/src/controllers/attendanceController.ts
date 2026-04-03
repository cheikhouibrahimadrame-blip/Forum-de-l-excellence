import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const markAttendanceValidation = [
  body('studentId').isUUID().withMessage('ID étudiant invalide'),
  body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Statut invalide'),
  body('date').isISO8601().withMessage('Date invalide'),
];

export const markAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN can mark attendance
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé - permissions insuffisantes' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { studentId, status, date, remarks } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Étudiant non trouvé' });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        status: status as any,
        date: new Date(date),
        remarks: remarks || null,
        markedById: req.user!.id,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error({ error }, 'Erreur lors du marquage de la présence:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getStudentAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // STUDENT can only view their own, PARENT can view children, TEACHER/ADMIN can view all
    if (req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!student || student.id !== studentId) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    } else if (req.user?.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { parentStudents: true },
      });
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    }

    const where: any = { studentId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        markedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    const stats = {
      total: attendance.length,
      present: attendance.filter((a: any) => a.status === 'PRESENT').length,
      absent: attendance.filter((a: any) => a.status === 'ABSENT').length,
      late: attendance.filter((a: any) => a.status === 'LATE').length,
      excused: attendance.filter((a: any) => a.status === 'EXCUSED').length,
      percentage: attendance.length > 0 
        ? Math.round((attendance.filter((a: any) => a.status === 'PRESENT').length / attendance.length) * 100)
        : 0,
    };

    res.json({ success: true, data: { attendance, stats } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération de la présence:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getClassAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { courseId } = req.params;
    const { date } = req.query;

    const where: any = { courseId };
    if (date) where.date = new Date(date as string);

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération de la présence de classe:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    const attendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: status as any,
        remarks: remarks || null,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour de la présence:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { attendanceId } = req.params;
    await prisma.attendance.delete({ where: { id: attendanceId } });

    res.json({ success: true, message: 'Présence supprimée' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression de la présence:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
