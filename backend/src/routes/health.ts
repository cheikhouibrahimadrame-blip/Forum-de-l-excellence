import express from 'express';
import { 
  updateHealthRecord,
  updateHealthRecordValidation,
  getHealthRecord,
  getAllHealthRecords,
  deleteHealthRecord
} from '../controllers/healthController';
import { authenticate, authorize } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 50 requests per 15 minutes for health data (sensitive)
const healthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(healthLimiter);

// Update health record (STUDENT updates own, PARENT updates children, ADMIN updates anyone)
router.put(
  '/:studentId',
  updateHealthRecordValidation,
  updateHealthRecord
);

// Get health record (STUDENT views own, PARENT views children, TEACHER/ADMIN views all)
router.get('/:studentId', getHealthRecord);

// Get all health records (ADMIN/TEACHER only)
router.get(
  '/',
  authorize(['ADMIN', 'TEACHER']),
  getAllHealthRecords
);

// Delete health record (ADMIN only)
router.delete(
  '/:studentId',
  authorize(['ADMIN']),
  deleteHealthRecord
);

export default router;
