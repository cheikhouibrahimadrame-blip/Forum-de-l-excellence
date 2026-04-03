import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createParentStudentLink,
  getParentStudents,
  getMyStudents,
  deleteParentStudentLink,
  getAllParentStudentLinks
} from '../controllers/parentStudentController';

const router = Router();

// Admin routes
router.post('/', authenticate, authorize(['ADMIN']), createParentStudentLink);
router.get('/all', authenticate, authorize(['ADMIN']), getAllParentStudentLinks);
router.get('/parent/:parentId', authenticate, authorize(['ADMIN', 'PARENT']), getParentStudents);
router.delete('/:linkId', authenticate, authorize(['ADMIN']), deleteParentStudentLink);

// Parent routes
router.get('/my-students', authenticate, authorize(['PARENT']), getMyStudents);

export default router;
