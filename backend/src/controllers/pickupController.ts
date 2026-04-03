import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const addPickupPersonValidation = [
  body('studentId')
    .isUUID()
    .withMessage('ID étudiant invalide - doit être un UUID valide'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom requis (2-100 caractères)'),
  body('relationship')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Relation requise (ex: père, mère, tuteur, 2-50 caractères)'),
  body('phone')
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Téléphone invalide - formats acceptés: +221771234567, (221) 77-1234567, 77 123 45 67'),
  body('idNumber')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 30 })
    .withMessage('Numéro d\'identité invalide'),
  body('photoUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('URL de photo invalide'),
  body('validFrom')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date de début invalide'),
  body('validUntil')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Date de fin invalide'),
];

export const addAuthorizedPickupPerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array() as any[];
      res.status(400).json({ 
        success: false, 
        message: 'Erreur de validation',
        errors: errorArray.map((err) => ({
          field: err.param || err.field,
          message: err.msg,
          value: err.value
        }))
      });
      return;
    }

    // PARENT can add for their children, ADMIN can add for anyone
    const { studentId, name, relationship, phone, photoUrl, idNumber, validFrom, validUntil } = req.body;

    // Permission check
    if (req.user?.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { parentStudents: true },
      });
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
        res.status(403).json({ success: false, error: 'Accès refusé - Vous ne pouvez ajouter des personnes que pour vos enfants' });
        return;
      }
    } else if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - Permissions insuffisantes' });
      return;
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Étudiant non trouvé', code: 'STUDENT_NOT_FOUND' });
      return;
    }

    const pickup = await prisma.authorizedPickup.create({
      data: {
        studentId,
        name,
        relationship,
        phone,
        photoUrl: photoUrl || null,
        idNumber: idNumber || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ 
      success: true, 
      message: 'Personne autorisée ajoutée avec succès',
      data: pickup 
    });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de l\'ajout de la personne autorisée');
    res.status(500).json({ success: false, error: 'Erreur serveur', code: 'INTERNAL_ERROR' });
  }
};

export const getAuthorizedPickupPeople = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // STUDENT can view their own, PARENT can view children, TEACHER/ADMIN can view all
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

    // Get active and valid pickup people
    const now = new Date();
    const pickupPeople = await prisma.authorizedPickup.findMany({
      where: {
        studentId,
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: pickupPeople });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des personnes autorisées:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getAllAuthorizedPickupPeople = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { studentId } = req.query;
    const where: any = studentId ? { studentId: studentId as string } : {};

    const pickupPeople = await prisma.authorizedPickup.findMany({
      where,
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: pickupPeople });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des personnes autorisées:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updatePickupPerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // PARENT can update their children's, ADMIN can update anyone
    const { pickupId } = req.params;
    const { name, relationship, phone, photoUrl, idNumber, validFrom, validUntil, isActive } = req.body;

    // Verify ownership
    const pickup = await prisma.authorizedPickup.findUnique({
      where: { id: pickupId },
      include: { student: true },
    });

    if (!pickup) {
      res.status(404).json({ success: false, error: 'Personne autorisée non trouvée' });
      return;
    }

    if (req.user?.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { parentStudents: true },
      });
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === pickup.studentId)) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    } else if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const updated = await prisma.authorizedPickup.update({
      where: { id: pickupId },
      data: {
        name: name || undefined,
        relationship: relationship || undefined,
        phone: phone || undefined,
        photoUrl: photoUrl || undefined,
        idNumber: idNumber || undefined,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour de la personne autorisée:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deletePickupPerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { pickupId } = req.params;

    // Verify ownership
    const pickup = await prisma.authorizedPickup.findUnique({
      where: { id: pickupId },
      include: { student: true },
    });

    if (!pickup) {
      res.status(404).json({ success: false, error: 'Personne autorisée non trouvée' });
      return;
    }

    if (req.user?.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { parentStudents: true },
      });
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === pickup.studentId)) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    } else if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    await prisma.authorizedPickup.delete({ where: { id: pickupId } });

    res.json({ success: true, message: 'Personne autorisée supprimée' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression de la personne autorisée:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const logPickup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN or designated staff
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { studentId, pickedUpBy, pickupTime, notes } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Étudiant non trouvé' });
      return;
    }

    const log = await prisma.pickupLog.create({
      data: {
        studentId,
        pickedUpBy,
        pickupTime: new Date(pickupTime),
        verifiedById: req.user!.id,
        notes: notes || null,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        verifiedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: log });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de l\'enregistrement du retrait');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getPickupLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN, TEACHER, or PARENT (for their children)
    const { studentId, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (req.user?.role === 'PARENT' && studentId) {
      const parent = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { parentStudents: true },
      });
      if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId as string)) {
        res.status(403).json({ success: false, error: 'Accès refusé' });
        return;
      }
    } else if (!['ADMIN', 'TEACHER'].includes(req.user?.role || '') && !studentId) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const where: any = studentId ? { studentId: studentId as string } : {};
    if (startDate || endDate) {
      where.pickupTime = {};
      if (startDate) where.pickupTime.gte = new Date(startDate as string);
      if (endDate) where.pickupTime.lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.pickupLog.findMany({
        where,
        include: {
          student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          verifiedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { pickupTime: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.pickupLog.count({ where }),
    ]);

    res.json({ success: true, data: { logs, total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des journaux de retrait:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
