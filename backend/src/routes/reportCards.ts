import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getReportCard,
  upsertReportCard,
} from '../controllers/reportCardController';

const router = express.Router();

// All endpoints require authentication. Role-based access (read
// scoping + write filtering ADMIN vs TEACHER) is enforced
// inside the controller, so a single PUT can serve both roles
// without needing to expose two parallel paths.
router.get('/', authenticate, getReportCard);
router.put('/', authenticate, upsertReportCard);

export default router;
