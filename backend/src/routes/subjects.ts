import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

let subjectsStore: Array<{
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isActive: boolean;
}> = [];

router.use(authenticate);

router.get('/', (_req, res) => {
  res.json({ success: true, data: subjectsStore });
});

router.post('/', authorize(['ADMIN']), (req, res) => {
  const { name, code, description, color, isActive = true } = req.body;

  if (!name || !code) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const newSubject = {
    id: crypto.randomUUID(),
    name,
    code,
    description,
    color,
    isActive: Boolean(isActive)
  };

  subjectsStore = [newSubject, ...subjectsStore];
  res.status(201).json({ success: true, data: newSubject });
});

router.put('/:subjectId', authorize(['ADMIN']), (req, res) => {
  const { subjectId } = req.params;
  const index = subjectsStore.findIndex(item => item.id === subjectId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Subject not found' });
    return;
  }

  const updated = {
    ...subjectsStore[index],
    ...req.body,
    isActive: req.body.isActive != null ? Boolean(req.body.isActive) : subjectsStore[index].isActive
  };

  subjectsStore[index] = updated;
  res.json({ success: true, data: updated });
});

router.delete('/:subjectId', authorize(['ADMIN']), (req, res) => {
  const { subjectId } = req.params;
  const existing = subjectsStore.find(item => item.id === subjectId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Subject not found' });
    return;
  }

  subjectsStore = subjectsStore.filter(item => item.id !== subjectId);
  res.json({ success: true });
});

export default router;
