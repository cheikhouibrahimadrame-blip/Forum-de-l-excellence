import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';


// Create parent-student link
export const createParentStudentLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { parentId, studentIds, relationship = 'Parent' } = req.body;

    logger.debug({ parentId, studentCount: studentIds?.length, relationship }, 'Creating parent-student link');

    if (!parentId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "L'identifiant du parent et la liste des identifiants d'élèves sont requis"
      });
      return;
    }

    // Verify parent exists (accept Parent.id, Parent.userId, or User.email)
    const parentIdentifier = String(parentId);
    logger.debug({ parentIdentifier }, 'Parent lookup by id');
    let parent = await prisma.parent.findUnique({
      where: { id: parentIdentifier }
    });

    if (!parent) {
      const parentLookup = parentIdentifier.includes('@')
        ? { email: parentIdentifier }
        : { id: parentIdentifier };
      logger.debug({ parentLookup }, 'Parent user lookup');

      const parentUser = await prisma.user.findUnique({
        where: parentLookup
      });

      if (parentUser && parentUser.role !== 'PARENT') {
        res.status(400).json({
          success: false,
          error: "L'utilisateur sélectionné n'est pas un parent"
        });
        return;
      }

      if (parentUser) {
        parent = await prisma.parent.findUnique({
          where: { userId: parentUser.id }
        });

        if (!parent) {
          logger.info({ userId: parentUser.id }, 'Creating missing parent profile');
          parent = await prisma.parent.create({
            data: {
              userId: parentUser.id,
              relationship,
              address: 'Non renseignée'
            }
          });
        }
      }
    }

    if (parent) {
      const parentUser = await prisma.user.findUnique({
        where: { id: parent.userId }
      });
      if (parentUser && parentUser.role !== 'PARENT') {
        res.status(400).json({
          success: false,
          error: "Le profil sélectionné n'est pas associé à un parent"
        });
        return;
      }
    }

    if (!parent) {
      res.status(404).json({
        success: false,
        error: 'Profil parent introuvable'
      });
      return;
    }

    // Create links for each student
    const links = await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Verify student exists (accept Student.id, Student.userId, or User.email)
        const studentIdentifier = String(studentId);
        logger.debug({ studentIdentifier }, 'Student lookup by id');
        let student = await prisma.student.findUnique({
          where: { id: studentIdentifier }
        });

        if (!student) {
          const studentLookup = studentIdentifier.includes('@')
            ? { email: studentIdentifier }
            : { id: studentIdentifier };
          logger.debug({ studentLookup }, 'Student user lookup');

          const studentUser = await prisma.user.findUnique({
            where: studentLookup
          });

          if (studentUser && studentUser.role !== 'STUDENT') {
            return { studentId, success: false, error: "L'utilisateur sélectionné n'est pas un élève" };
          }

          if (studentUser) {
            student = await prisma.student.findUnique({
              where: { userId: studentUser.id }
            });

            if (!student) {
              const studentIdValue = `STU-${studentUser.id.replace(/-/g, '').slice(0, 12)}`;
              logger.info({ userId: studentUser.id }, 'Creating missing student profile');
              student = await prisma.student.create({
                data: {
                  userId: studentUser.id,
                  studentId: studentIdValue,
                  dateOfBirth: new Date(),
                  enrollmentDate: new Date()
                }
              });
            }
          }
        }

        if (!student) {
          return { studentId, success: false, error: 'Profil élève introuvable' };
        }

        const studentUser = await prisma.user.findUnique({
          where: { id: student.userId }
        });
        if (studentUser && studentUser.role !== 'STUDENT') {
          return { studentId, success: false, error: "Le profil sélectionné n'est pas associé à un élève" };
        }

        // Check if link already exists
        const existingLink = await prisma.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId: parent.id,
              studentId: student.id
            }
          }
        });

        if (existingLink) {
          return { studentId, success: false, error: 'Lien déjà existant' };
        }

        // Create the link.
        // P3-6: canAccessGrades / canAccessSchedule were dropped — they
        // were always true and never enforced. See schema comment.
        const link = await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship,
            isPrimaryContact: false
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        return { studentId, success: true, link };
      })
    );

    const successful = links.filter(l => l.success);
    const failed = links.filter(l => !l.success);

    res.json({
      success: true,
      data: {
        created: successful.length,
        failed: failed.length,
        links: successful.map(l => l.link),
        errors: failed
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error creating parent-student link');
    res.status(500).json({
      success: false,
      error: 'Échec de création du lien parent-élève'
    });
  }
};

// Get all students linked to a parent
export const getParentStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { parentId } = req.params;

    const links = await prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: { students: links.map(link => ({
        ...link.student,
        linkId: link.id,
        relationship: link.relationship,
        isPrimaryContact: link.isPrimaryContact
      }))}
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching parent students');
    res.status(500).json({
      success: false,
      error: 'Échec de récupération des élèves'
    });
  }
};

// Get students for current logged-in parent
export const getMyStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Non autorisé'
      });
      return;
    }

    if (userRole !== 'PARENT') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    // Find parent record
    const parent = await prisma.parent.findUnique({
      where: { userId }
    });

    if (!parent) {
      res.json({
        success: true,
        data: { students: [] }
      });
      return;
    }

    // Get all linked students
    const links = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            enrollments: {
              include: {
                course: {
                  include: {
                    program: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: { 
        students: links.map(link => ({
          ...link.student,
          linkId: link.id,
          relationship: link.relationship,
          isPrimaryContact: link.isPrimaryContact
        }))
      }
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching my students');
    res.status(500).json({
      success: false,
      error: 'Échec de récupération des élèves'
    });
  }
};

// Delete parent-student link
export const deleteParentStudentLink = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { linkId } = req.params;

    await prisma.parentStudent.delete({
      where: { id: linkId }
    });

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Error deleting parent-student link');
    res.status(500).json({
      success: false,
      error: 'Échec de suppression du lien'
    });
  }
};

// Get all parent-student links (for admin)
export const getAllParentStudentLinks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const links = await prisma.parentStudent.findMany({
      include: {
        parent: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        parent: {
          user: {
            lastName: 'asc'
          }
        }
      }
    });

    res.json({
      success: true,
      data: { links }
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching all parent-student links');
    res.status(500).json({
      success: false,
      error: 'Échec de récupération des liens'
    });
  }
};
