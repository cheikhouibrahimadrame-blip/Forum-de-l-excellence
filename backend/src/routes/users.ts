import express from 'express';
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deactivateUser, 
  activateUser, 
  resetPassword,
  updateUserValidation,
  createUser,
  createUserValidation 
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, authorize(['ADMIN']), createUserValidation, createUser);
router.get('/', authenticate, authorize(['ADMIN', 'TEACHER']), getUsers);
router.get('/:userId', authenticate, authorize(['ADMIN']), getUser);
router.put('/:userId', authenticate, authorize(['ADMIN']), updateUserValidation, updateUser);
router.patch('/:userId/deactivate', authenticate, authorize(['ADMIN']), deactivateUser);
router.patch('/:userId/activate', authenticate, authorize(['ADMIN']), activateUser);
router.post('/:userId/reset-password', authenticate, authorize(['ADMIN']), resetPassword);

export default router;