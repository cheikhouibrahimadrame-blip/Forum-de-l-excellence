import express from 'express';
import { 
  addAuthorizedPickupPerson,
  addPickupPersonValidation,
  getAllAuthorizedPickupPeople,
  getAuthorizedPickupPeople,
  updatePickupPerson,
  deletePickupPerson,
  logPickup,
  getPickupLogs
} from '../controllers/pickupController';
import { authenticate, authorize } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit: 100 requests per 15 minutes for pickup endpoints
const pickupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Trop de requêtes, réessayez plus tard' },
});

router.use(authenticate);
router.use(pickupLimiter);

// Add authorized pickup person (PARENT can add for their children, ADMIN can add for anyone)
router.post(
  '/authorized/add',
  addPickupPersonValidation,
  addAuthorizedPickupPerson
);

// List all authorized pickup people (ADMIN/TEACHER)
router.get(
  '/authorized',
  authorize(['ADMIN', 'TEACHER']),
  getAllAuthorizedPickupPeople
);

// Get pickup logs (ADMIN/TEACHER views all, PARENT views their children)
router.get('/logs/history', getPickupLogs);

// Get authorized pickup people for a student (STUDENT views own, PARENT views children, TEACHER/ADMIN views all)
router.get(
  '/:studentId',
  getAuthorizedPickupPeople
);

// Update pickup person (PARENT updates their children's, ADMIN updates anyone)
router.put(
  '/authorized/:pickupId',
  updatePickupPerson
);

// Delete pickup person (PARENT deletes their children's, ADMIN deletes anyone)
router.delete(
  '/authorized/:pickupId',
  deletePickupPerson
);

// Log a pickup event (ADMIN/TEACHER only)
router.post(
  '/log',
  authorize(['ADMIN', 'TEACHER']),
  logPickup
);

export default router;
