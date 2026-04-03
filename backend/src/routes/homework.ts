import express from 'express';
import { 
  createHomework,
  createHomeworkValidation,
  submitHomework,
  getHomeworks,
  getSubmissions,
  gradeSubmission,
  deleteHomework
} from '../controllers/homeworkController';
import { authenticate, authorize } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 100 requests per 15 minutes for homework endpoints
const homeworkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(homeworkLimiter);

// Create homework (TEACHER/ADMIN only)
router.post(
  '/create',
  authorize(['TEACHER', 'ADMIN']),
  createHomeworkValidation,
  createHomework
);

// Get homeworks (STUDENT views assigned, TEACHER/ADMIN views their homeworks)
router.get('/', getHomeworks);

// Submit homework (STUDENT only)
router.post(
  '/:homeworkId/submit',
  authorize(['STUDENT']),
  submitHomework
);

// Get submissions for a homework (TEACHER/ADMIN only)
router.get(
  '/:homeworkId/submissions',
  authorize(['TEACHER', 'ADMIN']),
  getSubmissions
);

// Grade a submission (TEACHER/ADMIN only)
router.put(
  '/submission/:submissionId/grade',
  authorize(['TEACHER', 'ADMIN']),
  gradeSubmission
);

// Delete homework (ADMIN only)
router.delete(
  '/:homeworkId',
  authorize(['ADMIN']),
  deleteHomework
);

export default router;
