import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const logBehaviorValidation = [
  body('studentId').isUUID().withMessage('ID étudiant invalide'),
  body('type').isIn(['POSITIVE', 'NEGATIVE', 'INCIDENT']).withMessage('Type invalide'),
  body('category').isIn(['ACADEMIC', 'SOCIAL', 'DISCIPLINE', 'PARTICIPATION', 'KINDNESS']).withMessage('Catégorie invalide'),
  body('description').isLength({ min: 5 }).withMessage('Description requise (min 5 caractères)'),
];

export const logBehavior = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN can log behavior
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé - permissions insuffisantes' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { studentId, type, category, description, points, date } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Étudiant non trouvé' });
      return;
    }

    // Get or verify teacher
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
    if (req.user?.role === 'TEACHER' && !teacher) {
      res.status(500).json({ success: false, error: 'Profil enseignant non trouvé' });
      return;
    }

    const behavior = await prisma.behaviorLog.create({
      data: {
        studentId,
        teacherId: teacher?.id || req.user!.id, // Use teacher ID or fallback to user ID for admin
        type: type as any,
        category: category as any,
        description,
        points: points || 0,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: behavior });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de l\'enregistrement du comportement');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getStudentBehavior = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, type, category } = req.query;

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
    if (type) where.type = type;
    if (category) where.category = category;

    const behaviors = await prisma.behaviorLog.findMany({
      where,
      include: {
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    const stats = {
      total: behaviors.length,
      positive: behaviors.filter((b) => (b as any).type === 'POSITIVE').length,
      negative: behaviors.filter((b) => (b as any).type === 'NEGATIVE').length,
      incidents: behaviors.filter((b) => (b as any).type === 'INCIDENT').length,
      totalPoints: behaviors.reduce((sum: number, b) => sum + (b as any).points, 0),
    };

    res.json({ success: true, data: { behaviors, stats } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération du comportement:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getBehaviorReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER, ADMIN, PARENT can view reports
    if (!['TEACHER', 'ADMIN', 'PARENT'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const behaviors = await prisma.behaviorLog.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: behaviors });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération du rapport:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateBehavior = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { behaviorId } = req.params;
    const { type, category, description, points, date } = req.body;

    const behavior = await prisma.behaviorLog.update({
      where: { id: behaviorId },
      data: {
        type: type ? (type as any) : undefined,
        category: category ? (category as any) : undefined,
        description: description || undefined,
        points: points !== undefined ? points : undefined,
        date: date ? new Date(date) : undefined,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: behavior });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour du comportement:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteBehavior = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { behaviorId } = req.params;
    await prisma.behaviorLog.delete({ where: { id: behaviorId } });

    res.json({ success: true, message: 'Comportement supprimé' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression du comportement:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
