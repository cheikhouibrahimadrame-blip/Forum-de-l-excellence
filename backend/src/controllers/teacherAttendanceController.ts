import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';

/**
 * Teacher attendance is an admin-only concern (HR-style presence tracking).
 * A single record per (teacherId, date) — enforced at the schema level.
 */
export const markTeacherAttendanceValidation = [
  body('teacherId').isUUID().withMessage('ID enseignant invalide'),
  body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Statut invalide'),
  body('date').isISO8601().withMessage('Date invalide'),
];

export const markTeacherAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { teacherId, status, date, remarks } = req.body;

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      res.status(404).json({ success: false, error: 'Enseignant non trouvé' });
      return;
    }

    const attendanceDate = new Date(date);

    // Upsert on (teacherId, date) so re-submitting for the same day edits in place
    const attendance = await (prisma as any).teacherAttendance.upsert({
      where: { teacherId_date: { teacherId, date: attendanceDate } },
      update: {
        status,
        remarks: remarks || null,
        markedById: req.user!.id,
      },
      create: {
        teacherId,
        status,
        date: attendanceDate,
        remarks: remarks || null,
        markedById: req.user!.id,
      },
      include: {
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error({ error }, 'Erreur lors du marquage de la présence enseignant');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getTeacherAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    // Teachers can only view their own records
    if (req.user?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
      if (!teacher || teacher.id !== teacherId) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    }

    const where: any = { teacherId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendance = await (prisma as any).teacherAttendance.findMany({
      where,
      include: {
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
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
    logger.error({ error }, 'Erreur lors de la récupération de la présence enseignant');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateTeacherAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    const attendance = await (prisma as any).teacherAttendance.update({
      where: { id: attendanceId },
      data: {
        status: status ? (status as any) : undefined,
        remarks: remarks !== undefined ? (remarks || null) : undefined,
      },
      include: {
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour de la présence enseignant');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteTeacherAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { attendanceId } = req.params;
    await (prisma as any).teacherAttendance.delete({ where: { id: attendanceId } });

    res.json({ success: true, message: 'Présence enseignant supprimée' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression de la présence enseignant');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
