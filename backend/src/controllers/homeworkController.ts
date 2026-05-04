import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const createHomeworkValidation = [
  body('subject').isLength({ min: 2 }).withMessage('Sujet requis'),
  body('title').isLength({ min: 2 }).withMessage('Titre requis'),
  body('description').isLength({ min: 5 }).withMessage('Description requise'),
  body('dueDate').isISO8601().withMessage('Date limite invalide'),
];

export const createHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé - permissions insuffisantes' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { subject, title, description, dueDate, courseId, attachmentUrl } = req.body;

    // Get or verify teacher
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
    if (req.user?.role === 'TEACHER' && !teacher) {
      res.status(404).json({ success: false, error: 'Profil enseignant non trouvé' });
      return;
    }

    if (req.user?.role === 'ADMIN' && !req.body.teacherId) {
      res.status(400).json({ success: false, error: 'teacherId requis pour un admin' });
      return;
    }

    const homework = await prisma.homework.create({
      data: {
        subject,
        title,
        description,
        dueDate: new Date(dueDate),
        courseId: courseId || null,
        attachmentUrl: attachmentUrl || null,
        teacherId: req.user?.role === 'TEACHER' ? teacher!.id : req.body.teacherId,
      },
      include: {
        submissions: { select: { id: true, studentId: true } },
      },
    });

    // Immediate notifications for relevant students and linked parents.
    if (homework.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: homework.courseId },
        select: {
          name: true,
          code: true,
          enrollments: {
            select: {
              student: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  },
                  parentStudents: {
                    include: {
                      parent: {
                        select: {
                          userId: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (course) {
        const studentMessages = course.enrollments
          .map((enrollment) => enrollment.student)
          .filter((student) => !!student.userId)
          .map((student) => ({
            senderId: req.user!.id,
            receiverId: student.userId,
            subject: 'Nouveau devoir publié',
            content: `Un nouveau devoir a été publié pour ${course.code} ${course.name}: ${homework.title}.`
          }));

        const parentMessages = course.enrollments
          .flatMap((enrollment) => {
            const student = enrollment.student;
            const childName = [student.user?.firstName, student.user?.lastName].filter(Boolean).join(' ').trim();
            return student.parentStudents
              .filter((link) => !!link.parent?.userId)
              .map((link) => ({
                senderId: req.user!.id,
                receiverId: link.parent!.userId,
                subject: 'Nouveau devoir pour votre enfant',
                content: `Nouveau devoir pour ${childName || 'votre enfant'} (${course.code} ${course.name}): ${homework.title}.`
              }));
          });

        const allMessages = [...studentMessages, ...parentMessages];
        if (allMessages.length > 0) {
          await prisma.message.createMany({ data: allMessages });
        }
      }
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: 'CREATE',
      entity: 'HOMEWORK',
      entityId: homework.id
    });

    res.json({ success: true, data: { ...homework, publicationStatus: 'PUBLISHED' } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la création du devoir:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const submitHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only STUDENT
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({ success: false, error: 'Accès refusé - étudiants uniquement' });
      return;
    }

    const { homeworkId } = req.params;
    const { notes } = req.body;

    // Get student ID
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Profil étudiant non trouvé' });
      return;
    }

    // Check if homework exists
    const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!homework) {
      res.status(404).json({ success: false, error: 'Devoir non trouvé' });
      return;
    }

    // Check if already submitted
    const existing = await prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    });

    if (existing) {
      // Update existing submission
      const submission = await prisma.homeworkSubmission.update({
        where: { id: existing.id },
        data: {
          submittedAt: new Date(),
          notes: notes || null,
          status: 'SUBMITTED' as any,
        },
        include: {
          student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
      });
      res.json({ success: true, data: submission });
      return;
    }

    // Create new submission
    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
        submittedAt: new Date(),
        notes: notes || null,
        status: 'SUBMITTED' as any,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la soumission du devoir:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getHomeworks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.query;

    if (req.user?.role === 'STUDENT') {
      // Get assigned homeworks for student
      const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
      if (!student) {
        res.status(404).json({ success: false, error: 'Profil étudiant non trouvé' });
        return;
      }

      const homeworks = await prisma.homework.findMany({
        where: courseId ? { courseId: courseId as string } : {},
        include: {
          submissions: {
            where: { studentId: student.id },
            select: { id: true, status: true, submittedAt: true, notes: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      res.json({ success: true, data: homeworks });
      return;
    }

    // TEACHER or ADMIN - get their homeworks
    const where: any = {};
    if (req.user?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) {
        res.status(404).json({ success: false, error: 'Profil enseignant non trouvé' });
        return;
      }
      where.teacherId = teacher.id;
    }
    if (courseId) where.courseId = courseId;

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        submissions: { select: { id: true, studentId: true, status: true, submittedAt: true } },
      },
      orderBy: { dueDate: 'desc' },
    });

    res.json({ success: true, data: homeworks });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des devoirs:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { homeworkId } = req.params;

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        checkedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des soumissions:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const gradeSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only TEACHER or ADMIN
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const { submissionId } = req.params;
    const { status, notes } = req.body;

    const submission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status: status as any,
        checkedById: req.user!.id,
        notes: notes || null,
      },
      include: {
        student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la notation du devoir:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const updateHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!['TEACHER', 'ADMIN'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Accès refusé - permissions insuffisantes' });
      return;
    }

    const { homeworkId } = req.params;
    const { subject, title, description, dueDate, attachmentUrl } = req.body;

    const existing = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Devoir non trouvé' });
      return;
    }

    // Teachers can only update their own homework
    if (req.user?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher || existing.teacherId !== teacher.id) {
        res.status(403).json({ success: false, error: 'Vous ne pouvez modifier que vos propres devoirs' });
        return;
      }
    }

    const data: any = {};
    if (subject !== undefined) data.subject = subject;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (attachmentUrl !== undefined) data.attachmentUrl = attachmentUrl || null;

    const homework = await prisma.homework.update({
      where: { id: homeworkId },
      data,
      include: {
        submissions: { select: { id: true, studentId: true, status: true, submittedAt: true } },
      },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: 'UPDATE',
      entity: 'HOMEWORK',
      entityId: homeworkId
    });

    res.json({ success: true, data: homework });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la mise à jour du devoir:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Only ADMIN
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Accès refusé - admin uniquement' });
      return;
    }

    const { homeworkId } = req.params;
    await prisma.homework.delete({ where: { id: homeworkId } });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: 'DELETE',
      entity: 'HOMEWORK',
      entityId: homeworkId
    });

    res.json({ success: true, message: 'Devoir supprimé' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression du devoir:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
