import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';


export const createAppointmentValidation = [
  body('recipientId').isUUID().withMessage('ID destinataire invalide'),
  body('appointmentType').isIn(['ACADEMIC_ADVISING', 'PARENT_CONFERENCE', 'COUNSELING', 'ADMINISTRATIVE', 'TUTORING']).withMessage('Type de rendez-vous invalide'),
  body('scheduledDatetime').isISO8601().withMessage('Date et heure requises'),
  body('durationMinutes').isInt({ min: 15, max: 180 }).withMessage('Durée invalide (15-180 minutes)'),
  body('location').optional().isLength({ min: 2 }).withMessage('Localisation invalide'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes trop longues')
];

export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {
      OR: [
        { requesterId: req.user!.id },
        { recipientId: req.user!.id }
      ]
    };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.scheduledDatetime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        requester: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true,
            email: true 
          }
        },
        recipient: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true,
            email: true 
          }
        }
      },
      orderBy: { scheduledDatetime: 'asc' }
    });

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    logger.error({ error }, 'Get appointments error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        requester: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true 
          }
        },
        recipient: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true 
          }
        }
      }
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé'
      });
      return;
    }

    if (appointment.requesterId !== req.user!.id && appointment.recipientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    logger.error({ error }, 'Get appointment error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { recipientId, appointmentType, scheduledDatetime, durationMinutes, location, notes } = req.body;

    if (recipientId === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas créer un rendez-vous avec vous-même'
      });
      return;
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      res.status(404).json({
        success: false,
        error: 'Destinataire non trouvé'
      });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        requesterId: req.user!.id,
        recipientId,
        appointmentType,
        scheduledDatetime: new Date(scheduledDatetime),
        durationMinutes,
        location,
        notes
      },
      include: {
        requester: {
          select: { firstName: true, lastName: true, role: true }
        },
        recipient: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: { appointment }
    });
  } catch (error) {
    logger.error({ error }, 'Create appointment error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const updateAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { scheduledDatetime, durationMinutes, location, notes } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé'
      });
      return;
    }

    if (appointment.requesterId !== req.user!.id && appointment.recipientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledDatetime: scheduledDatetime ? new Date(scheduledDatetime) : undefined,
        durationMinutes: durationMinutes || appointment.durationMinutes,
        location: location !== undefined ? location : appointment.location,
        notes: notes !== undefined ? notes : appointment.notes
      },
      include: {
        requester: {
          select: { firstName: true, lastName: true, role: true }
        },
        recipient: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Rendez-vous mis à jour avec succès',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    logger.error({ error }, 'Update appointment error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé'
      });
      return;
    }

    if (appointment.requesterId !== req.user!.id && appointment.recipientId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Rendez-vous annulé avec succès'
    });
  } catch (error) {
    logger.error({ error }, 'Cancel appointment error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const confirmAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé'
      });
      return;
    }

    if (appointment.recipientId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Seul le destinataire peut confirmer ce rendez-vous'
      });
      return;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
      include: {
        requester: {
          select: { firstName: true, lastName: true }
        },
        recipient: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Rendez-vous confirmé avec succès',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    logger.error({ error }, 'Confirm appointment error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getAvailableSlots = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { recipientId, date, duration } = req.query;

    if (!recipientId || !date) {
      res.status(400).json({
        success: false,
        error: 'Destinataire et date requis'
      });
      return;
    }

    const targetDate = new Date(date as string);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(8, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(17, 0, 0, 0);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        recipientId: recipientId as string,
        scheduledDatetime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    const workingHours = [
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' }
    ];

    const availableSlots = workingHours.filter(slot => {
      const slotStart = new Date(`${date}T${slot.start}`);
      const slotEnd = new Date(`${date}T${slot.end}`);
      
      return !existingAppointments.some((appointment: any) => {
        const appointmentStart = new Date(appointment.scheduledDatetime);
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.durationMinutes * 60000);
        
        return (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
               (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
               (slotStart <= appointmentStart && slotEnd >= appointmentEnd);
      });
    });

    res.json({
      success: true,
      data: {
        availableSlots: availableSlots.map(slot => ({
          startTime: slot.start,
          endTime: slot.end,
          available: true
        }))
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get available slots error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const getAppointmentTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appointmentTypes = [
      {
        type: 'ACADEMIC_ADVISING',
        description: 'Conseil académique',
        defaultDuration: 30,
        availableRoles: ['TEACHER', 'ADMIN']
      },
      {
        type: 'PARENT_CONFERENCE',
        description: 'Conférence parent-enseignant',
        defaultDuration: 60,
        availableRoles: ['TEACHER']
      },
      {
        type: 'COUNSELING',
        description: 'Orientation et conseil',
        defaultDuration: 45,
        availableRoles: ['ADMIN']
      },
      {
        type: 'ADMINISTRATIVE',
        description: 'Rendez-vous administratif',
        defaultDuration: 30,
        availableRoles: ['ADMIN']
      },
      {
        type: 'TUTORING',
        description: 'Séance de tutorat',
        defaultDuration: 60,
        availableRoles: ['TEACHER']
      }
    ];

    res.json({
      success: true,
      data: { appointmentTypes }
    });
  } catch (error) {
    logger.error({ error }, 'Get appointment types error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};