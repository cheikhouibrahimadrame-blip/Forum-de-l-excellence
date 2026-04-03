import express from 'express';
import { 
  logBehavior,
  logBehaviorValidation,
  getStudentBehavior,
  getBehaviorReport,
  updateBehavior,
  deleteBehavior
} from '../controllers/behaviorController';
import { authenticate, authorize } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 100 requests per 15 minutes for behavior endpoints
const behaviorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(behaviorLimiter);

// Log a behavior incident (TEACHER/ADMIN only)
router.post(
  '/log',
  authorize(['TEACHER', 'ADMIN']),
  logBehaviorValidation,
  logBehavior
);

// Get student behavior history (STUDENT views own, PARENT views children, TEACHER/ADMIN views all)
router.get('/student/:studentId', getStudentBehavior);

// Get behavior report (TEACHER/ADMIN/PARENT only)
router.get(
  '/report',
  authorize(['TEACHER', 'ADMIN', 'PARENT']),
  getBehaviorReport
);

// Update behavior record (TEACHER/ADMIN only)
router.put(
  '/:behaviorId',
  authorize(['TEACHER', 'ADMIN']),
  updateBehavior
);

// Delete behavior record (ADMIN only)
router.delete(
  '/:behaviorId',
  authorize(['ADMIN']),
  deleteBehavior
);

export default router;
