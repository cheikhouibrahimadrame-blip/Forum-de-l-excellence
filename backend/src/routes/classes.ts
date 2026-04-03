import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

let classesStore: Array<{
  id: string;
  name: string;
  level: string;
  capacity: number;
  currentStudents: number;
  academicYear: string;
  mainTeacherId?: string;
  mainTeacher?: string;
}> = [];

router.use(authenticate);

router.get('/', (_req, res) => {
  res.json({ success: true, data: classesStore });
});

router.post('/', authorize(['ADMIN']), (req, res) => {
  const {
    name,
    level,
    capacity,
    currentStudents = 0,
    academicYear,
    mainTeacherId,
    mainTeacher
  } = req.body;

  if (!name || !level || !academicYear) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const newClass = {
    id: crypto.randomUUID(),
    name,
    level,
    capacity: Number(capacity) || 0,
    currentStudents: Number(currentStudents) || 0,
    academicYear,
    mainTeacherId,
    mainTeacher
  };

  classesStore = [newClass, ...classesStore];
  res.status(201).json({ success: true, data: newClass });
});

router.put('/:classId', authorize(['ADMIN']), (req, res) => {
  const { classId } = req.params;
  const index = classesStore.findIndex(item => item.id === classId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  const updated = {
    ...classesStore[index],
    ...req.body,
    capacity: req.body.capacity != null ? Number(req.body.capacity) : classesStore[index].capacity,
    currentStudents: req.body.currentStudents != null ? Number(req.body.currentStudents) : classesStore[index].currentStudents
  };

  classesStore[index] = updated;
  res.json({ success: true, data: updated });
});

router.delete('/:classId', authorize(['ADMIN']), (req, res) => {
  const { classId } = req.params;
  const existing = classesStore.find(item => item.id === classId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Class not found' });
    return;
  }

  classesStore = classesStore.filter(item => item.id !== classId);
  res.json({ success: true });
});

export default router;
