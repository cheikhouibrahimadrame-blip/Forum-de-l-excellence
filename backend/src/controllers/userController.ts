import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import logger from '../utils/logger';


export const updateUserValidation = [
  body('firstName').optional().isLength({ min: 2 }).withMessage('Prénom trop court'),
  body('lastName').optional().isLength({ min: 2 }).withMessage('Nom trop court'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Téléphone invalide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('role').optional().isIn(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).withMessage('Rôle invalide')
];

const passwordPolicy = body('password')
  .isLength({ min: 8 })
  .withMessage('Mot de passe requis (minimum 8 caractères)')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');

export const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  passwordPolicy,
  body('firstName').isLength({ min: 2 }).withMessage('Prénom requis (min 2)'),
  body('lastName').isLength({ min: 2 }).withMessage('Nom requis (min 2)'),
  body('role').isIn(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).withMessage('Rôle invalide'),
  body('isActive').optional().isBoolean().withMessage('isActive doit être booléen')
];

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status === 'active') where.isActive = true;
    if (status === 'disabled') where.isActive = false;
    if (status === 'mustChangePassword') where.mustChangePassword = true;

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          student: {
            select: {
              studentId: true,
              major: true,
              gpa: true,
              status: true
            }
          },
          parent: {
            select: {
              relationship: true
            }
          },
          teacher: {
            select: {
              employeeId: true,
              specialization: true
            }
          },
          admin: {
            select: {
              employeeId: true,
              department: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const pages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages
        }
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get users error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, role, phone, isActive = true } = req.body;

    const allowedDomains = (process.env.INSTITUTION_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
    if (allowedDomains.length > 0) {
      const domain = (email as string).split('@')[1] || '';
      if (!allowedDomains.includes(domain)) {
        res.status(400).json({ success: false, error: 'Email non autorisé (domaine institutionnel requis)' });
        return;
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          phone: phone || null,
          isActive,
          mustChangePassword: true
        },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true
        }
      });

      if (role === 'TEACHER') {
        await tx.teacher.create({
          data: {
            userId: createdUser.id,
            employeeId: `TCH-${crypto.randomUUID().slice(0, 8)}`,
            hireDate: new Date(),
            qualifications: []
          }
        });
      }

      return createdUser;
    });

    res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    logger.error({ error }, 'Create user error:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        student: {
          include: {
            enrollments: {
              include: {
                course: true
              }
            }
          }
        },
        parent: {
          include: {
            parentStudents: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
            }
          }
        },
        teacher: true,
        admin: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error({ error }, 'Get user error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { userId } = req.params;
    const { firstName, lastName, phone, email, isActive, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
      return;
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role) updateData.role = role;

    if (email) {
      const allowedDomains = (process.env.INSTITUTION_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
      const domain = email.split('@')[1] || '';
      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        res.status(400).json({ success: false, error: 'Email non autorisé (domaine institutionnel requis)' });
        return;
      }
      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user }
    });

    if (role && role !== existing.role) {
      await logAudit(prisma, {
        userId: req.user?.id,
        action: 'ROLE_CHANGE',
        entity: 'USER',
        entityId: userId
      });
    }
  } catch (error) {
    logger.error({ error }, 'Update user error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const deactivateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, mustChangePassword: true }
    });

    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès',
      data: { user }
    });
  } catch (error) {
    logger.error({ error }, 'Deactivate user error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const activateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    res.json({
      success: true,
      message: 'Utilisateur activé avec succès',
      data: { user }
    });
  } catch (error) {
    logger.error({ error }, 'Activate user error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const validation = await passwordPolicy.run(req);
    if (!validation.isEmpty()) {
      res.status(400).json({ success: false, errors: validation.array() });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: true }
    });

    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé. L’utilisateur devra le changer à la prochaine connexion.'
    });
  } catch (error) {
    logger.error({ error }, 'Reset password error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};