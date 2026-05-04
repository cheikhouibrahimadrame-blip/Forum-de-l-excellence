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

// P0-3: dedicated validator for the admin reset-password endpoint, which
// reads `newPassword` (not `password`). Before this fix the existing
// passwordPolicy ran against the wrong field and silently accepted any value.
const newPasswordPolicy = body('newPassword')
  .isLength({ min: 8 })
  .withMessage('Nouveau mot de passe requis (minimum 8 caractères)')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');

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

    // P1-10: teachers may only list students. They previously could enumerate
    // every account (including admins) with their email/phone exposed.
    if (req.user?.role === 'TEACHER') {
      where.role = 'STUDENT';
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
              id: true,
              studentId: true,
              major: true,
              gpa: true,
              status: true
            }
          },
          parent: {
            select: {
              id: true,
              relationship: true
            }
          },
          teacher: {
            select: {
              id: true,
              employeeId: true,
              specialization: true
            }
          },
          admin: {
            select: {
              id: true,
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

    // P1-9: every role must end up with the matching profile row. Without
    // this, a freshly-created STUDENT/PARENT/ADMIN had no profile and every
    // role-specific endpoint returned 404 ("Étudiant non trouvé" etc.).
    // Placeholder defaults (mirroring parentStudentController.ts) keep the
    // admin "Add user" UX one-click; the dedicated profile editors fill in
    // the real values later.
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

      const today = new Date();
      const shortUid = createdUser.id.replace(/-/g, '').slice(0, 12);

      switch (role) {
        case 'TEACHER':
          await tx.teacher.create({
            data: {
              userId: createdUser.id,
              employeeId: `TCH-${shortUid}`,
              hireDate: today,
              qualifications: []
            }
          });
          break;

        case 'STUDENT':
          await tx.student.create({
            data: {
              userId: createdUser.id,
              studentId: `STU-${shortUid}`,
              dateOfBirth: today,
              enrollmentDate: today
            }
          });
          break;

        case 'PARENT':
          await tx.parent.create({
            data: {
              userId: createdUser.id,
              relationship: 'Non renseignée',
              address: 'Non renseignée'
            }
          });
          break;

        case 'ADMIN':
          await tx.admin.create({
            data: {
              userId: createdUser.id,
              employeeId: `ADM-${shortUid}`,
              hireDate: today
            }
          });
          break;
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

    // P1-8: when the role actually changes, the profile rows must be reconciled
    // in the same transaction. Otherwise an old Student row lingers after a
    // STUDENT → TEACHER promotion and the matching Teacher row is missing,
    // breaking every role-specific endpoint until the admin re-creates the
    // user manually.
    const roleChanged = role && role !== existing.role;

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
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

      if (roleChanged) {
        // Drop the previous profile row (if any). The role-specific tables
        // cascade-delete from User, but here the User row stays; we only
        // want the obsolete profile gone.
        switch (existing.role) {
          case 'STUDENT': await tx.student.deleteMany({ where: { userId } }); break;
          case 'PARENT':  await tx.parent.deleteMany({ where: { userId } }); break;
          case 'TEACHER': await tx.teacher.deleteMany({ where: { userId } }); break;
          case 'ADMIN':   await tx.admin.deleteMany({ where: { userId } }); break;
        }

        // Create the matching profile for the new role using the same
        // placeholder defaults as createUser (P1-9).
        const today = new Date();
        const shortUid = userId.replace(/-/g, '').slice(0, 12);

        switch (role) {
          case 'TEACHER': {
            const exists = await tx.teacher.findUnique({ where: { userId } });
            if (!exists) {
              await tx.teacher.create({
                data: { userId, employeeId: `TCH-${shortUid}`, hireDate: today, qualifications: [] }
              });
            }
            break;
          }
          case 'STUDENT': {
            const exists = await tx.student.findUnique({ where: { userId } });
            if (!exists) {
              await tx.student.create({
                data: { userId, studentId: `STU-${shortUid}`, dateOfBirth: today, enrollmentDate: today }
              });
            }
            break;
          }
          case 'PARENT': {
            const exists = await tx.parent.findUnique({ where: { userId } });
            if (!exists) {
              await tx.parent.create({
                data: { userId, relationship: 'Non renseignée', address: 'Non renseignée' }
              });
            }
            break;
          }
          case 'ADMIN': {
            const exists = await tx.admin.findUnique({ where: { userId } });
            if (!exists) {
              await tx.admin.create({
                data: { userId, employeeId: `ADM-${shortUid}`, hireDate: today }
              });
            }
            break;
          }
        }
      }

      return updated;
    });

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user }
    });

    if (roleChanged) {
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

    // P0-3: validate the actual `newPassword` field, not a non-existent `password` field.
    const validation = await newPasswordPolicy.run(req);
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