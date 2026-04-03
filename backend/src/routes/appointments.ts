import express from 'express';
import { 
  getAppointments, 
  getAppointment, 
  createAppointment, 
  updateAppointment, 
  cancelAppointment, 
  confirmAppointment, 
  getAvailableSlots, 
  getAppointmentTypes,
  createAppointmentValidation 
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getAppointments);
router.get('/types', authenticate, getAppointmentTypes);
router.get('/available-slots', authenticate, getAvailableSlots);
router.get('/:appointmentId', authenticate, getAppointment);
router.post('/', authenticate, createAppointmentValidation, createAppointment);
router.put('/:appointmentId', authenticate, updateAppointment);
router.patch('/:appointmentId/confirm', authenticate, confirmAppointment);
router.delete('/:appointmentId', authenticate, cancelAppointment);

export default router;