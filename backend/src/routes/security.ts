import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  manualRotateSecrets,
  getSecretRotationStatus,
  getSecretRotationHistory,
  configureAutoRotation
} from '../controllers/securityController';

const router = Router();

/**
 * Security Management Endpoints
 * All require authentication AND admin role
 */
router.use(authenticate, authorize(['ADMIN']));

// Manual secret rotation
router.post('/rotate-secrets', manualRotateSecrets);

// Get rotation status
router.get('/secret-status', getSecretRotationStatus);

// Get rotation history/audit trail
router.get('/secret-history', getSecretRotationHistory);

// Configure automatic rotation
router.post('/configure-auto-rotation', configureAutoRotation);

export default router;
