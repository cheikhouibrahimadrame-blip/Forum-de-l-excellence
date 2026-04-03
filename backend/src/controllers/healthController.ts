import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const updateHealthRecordValidation = [
  body('allergies').optional().isArray().withMessage('Allergies doit être un tableau'),
  body('medicalConditions').optional().isArray().withMessage('Conditions médicales doit être un tableau'),
  body('bloodType').optional().isLength({ min: 1, max: 10 }).withMessage('Type sanguin invalide'),
];

export const updateHealthRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { allergies, medicalConditions, bloodType, medications, dietaryRestrictions, doctorName, doctorPhone, hospitalPreference, insuranceInfo, notes } = req.body;

    // STUDENT can only update their own, PARENT can update children, ADMIN can update anyone
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

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Étudiant non trouvé' });
      return;
    }

    // Update or create health record
    const healthRecord = await prisma.healthRecord.upsert({
      where: { studentId },
      update: {
        allergies: allergies || undefined,
        medicalConditions: medicalConditions || undefined,
        bloodType: bloodType || undefined,
        medications: medications || undefined,
        dietaryRestrictions: dietaryRestrictions || undefined,
        doctorName: doctorName || undefined,
        doctorPhone: doctorPhone || undefined,
        hospitalPreference: hospitalPreference || undefined,
        insuranceInfo: insuranceInfo || undefined,
        notes: notes || undefined,
      },
      create: {
        studentId,
        allergies: allergies || [],
        medicalConditions: medicalConditions || [],
        bloodType: bloodType || null,
        medications: medications || null,
        dietaryRestrictions: dietaryRestrictions || null,
        doctorName: doctorName || null,
        doctorPhone: doctorPhone || null,
        hospitalPreference: hospitalPreference || null,
        insuranceInfo: insuranceInfo || null,
        notes: notes || null,
      },
    });

    res.json({ success: true, data: healthRecord });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour du dossier santé:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getHealthRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

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

    const healthRecord = await prisma.healthRecord.findUnique({
      where: { studentId },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!healthRecord) {
      res.status(404).json({ success: false, error: 'Dossier santé non trouvé' });
      return;
    }

    res.json({ success: true, data: healthRecord });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération du dossier santé:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getAllHealthRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN or TEACHER
    if (!['ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const records = await prisma.healthRecord.findMany({
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { student: { user: { firstName: 'asc' } } },
    });

    res.json({ success: true, data: records });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des dossiers santé:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteHealthRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { studentId } = req.params;
    await prisma.healthRecord.delete({ where: { studentId } });

    res.json({ success: true, message: 'Dossier santé supprimé' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression du dossier santé:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
