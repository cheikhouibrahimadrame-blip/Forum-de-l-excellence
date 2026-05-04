import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth';
import {
  markTeacherAttendanceValidation,
  markTeacherAttendance,
  getTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
} from '../controllers/teacherAttendanceController';

const router = express.Router();

// Rate limit: 100 requests per 15 minutes (matches /api/attendance)
const teacherAttendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(teacherAttendanceLimiter);

// Mark or re-mark a teacher's attendance for a given date (ADMIN only)
router.post(
  '/mark',
  authorize(['ADMIN']),
  markTeacherAttendanceValidation,
  markTeacherAttendance,
);

// Get attendance records for a teacher (ADMIN: any; TEACHER: self only)
router.get(
  '/teacher/:teacherId',
  authorize(['ADMIN', 'TEACHER']),
  getTeacherAttendance,
);

// Update an existing record by its id (ADMIN only)
router.put(
  '/:attendanceId',
  authorize(['ADMIN']),
  updateTeacherAttendance,
);

// Delete a record (ADMIN only)
router.delete(
  '/:attendanceId',
  authorize(['ADMIN']),
  deleteTeacherAttendance,
);

export default router;
