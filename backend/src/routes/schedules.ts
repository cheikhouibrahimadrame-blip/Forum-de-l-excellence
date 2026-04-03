import express from 'express';
import { 
  getStudentSchedule, 
  getTeacherSchedule, 
  getScheduleSummary,
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../controllers/scheduleController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/student/:studentId', authenticate, getStudentSchedule);
router.get('/teacher/:teacherId', authenticate, getTeacherSchedule);
router.get('/summary', authenticate, authorize(['ADMIN']), getScheduleSummary);
router.post('/', authenticate, authorize(['TEACHER', 'ADMIN']), createSchedule);
router.put('/:scheduleId', authenticate, authorize(['TEACHER', 'ADMIN']), updateSchedule);
router.delete('/:scheduleId', authenticate, authorize(['TEACHER', 'ADMIN']), deleteSchedule);

export default router;