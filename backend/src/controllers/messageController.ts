import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';


export const sendMessageValidation = [
  body('receiverId').isUUID().withMessage('ID destinataire invalide'),
  body('subject').isLength({ min: 1, max: 255 }).withMessage('Sujet invalide'),
  body('content').isLength({ min: 1 }).withMessage('Contenu requis'),
];

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { receiverId, subject, content, attachments } = req.body;

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ success: false, error: 'Destinataire non trouvé' });
      return;
    }

    // Role-based validation - PARENT can message TEACHER/ADMIN
    // TEACHER can message PARENT/ADMIN/STUDENT
    // STUDENT can message TEACHER
    // ADMIN can message anyone
    const sendingRole = req.user?.role;
    const receivingRole = receiver.role;

    if (sendingRole === 'PARENT' && !['TEACHER', 'ADMIN'].includes(receivingRole)) {
      res.status(403).json({ success: false, error: 'Les parents peuvent uniquement contacter les enseignants' });
      return;
    }
    if (sendingRole === 'STUDENT' && receivingRole !== 'TEACHER') {
      res.status(403).json({ success: false, error: 'Les étudiants peuvent uniquement contacter les enseignants' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        subject,
        content,
        attachments: attachments ? {
          create: attachments.map((att: any) => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
          }))
        } : undefined,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
        attachments: true,
      },
    });

    res.json({ success: true, data: message });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de l\'envoi du message');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getReceivedMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    const where: any = { receiverId: userId };
    if (unreadOnly) where.isRead = false;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.message.count({ where }),
    ]);

    res.json({ success: true, data: { messages, total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des messages reçus:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getSentMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId },
        include: {
          receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.message.count({ where: { senderId: userId } }),
    ]);

    res.json({ success: true, data: { messages, total, pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des messages envoyés:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    // Verify message belongs to user
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.receiverId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error({ error }, 'Erreur lors du marquage comme lu:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    // Verify ownership
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || (message.senderId !== req.user?.id && message.receiverId !== req.user?.id)) {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    await prisma.message.delete({ where: { id: messageId } });

    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la suppression du message:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: req.user?.id,
        isRead: false,
      },
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    logger.error({ error }, 'Erreur lors du comptage des non-lus:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const getConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user?.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark all received messages as read
    await prisma.message.updateMany({
      where: {
        AND: [
          { senderId: otherUserId, receiverId: userId },
          { isRead: false },
        ],
      },
      data: { isRead: true },
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération de la conversation:');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
