import express from 'express';
import { 
  markAttendance, 
  markAttendanceValidation,
  getStudentAttendance, 
  getClassAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 100 requests per 15 minutes for attendance endpoints
const attendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(attendanceLimiter);

// Mark attendance (TEACHER/ADMIN only)
router.post(
  '/mark', 
  authorize(['TEACHER', 'ADMIN']),
  markAttendanceValidation,
  markAttendance
);

// Get student attendance (STUDENT views own, PARENT views children, TEACHER/ADMIN views all)
router.get('/student/:studentId', getStudentAttendance);

// Get class attendance for a course (TEACHER/ADMIN only)
router.get(
  '/class/:courseId', 
  authorize(['TEACHER', 'ADMIN']),
  getClassAttendance
);

// Update attendance record (TEACHER/ADMIN only)
router.put(
  '/:attendanceId', 
  authorize(['TEACHER', 'ADMIN']),
  updateAttendance
);

// Delete attendance (ADMIN only)
router.delete(
  '/:attendanceId', 
  authorize(['ADMIN']),
  deleteAttendance
);

export default router;
