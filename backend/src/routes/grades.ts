import express from 'express';
import { 
  getStudentGrades, 
  getCourseGrades, 
  createGrade, 
  updateGrade, 
  deleteGrade, 
  calculateGPA,
  createGradeValidation 
} from '../controllers/gradesController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/student/:studentId', authenticate, getStudentGrades);
router.get('/course/:courseId', authenticate, authorize(['TEACHER', 'ADMIN']), getCourseGrades);
router.post('/', authenticate, authorize(['TEACHER', 'ADMIN']), createGradeValidation, createGrade);
router.put('/:gradeId', authenticate, authorize(['TEACHER', 'ADMIN']), updateGrade);
router.delete('/:gradeId', authenticate, authorize(['TEACHER', 'ADMIN']), deleteGrade);
router.get('/gpa/:studentId', authenticate, calculateGPA);

export default router;