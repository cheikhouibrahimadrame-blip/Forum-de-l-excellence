import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

type Trimester = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type AcademicYear = {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  trimesters: Trimester[];
};

let academicYearsStore: AcademicYear[] = [];

router.use(authenticate);

router.get('/', (_req, res) => {
  res.json({ success: true, data: academicYearsStore });
});

router.post('/', authorize(['ADMIN']), (req, res) => {
  const { year, startDate, endDate, isActive = false, trimesters = [] } = req.body;

  if (!year || !startDate || !endDate) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const newYear: AcademicYear = {
    id: crypto.randomUUID(),
    year,
    startDate,
    endDate,
    isActive: Boolean(isActive),
    trimesters: Array.isArray(trimesters) ? trimesters.map((t: any) => ({
      id: t.id || crypto.randomUUID(),
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      isActive: Boolean(t.isActive)
    })) : []
  };

  if (newYear.isActive) {
    academicYearsStore = academicYearsStore.map(item => ({ ...item, isActive: false }));
  }

  academicYearsStore = [newYear, ...academicYearsStore];
  res.status(201).json({ success: true, data: newYear });
});

router.put('/:yearId', authorize(['ADMIN']), (req, res) => {
  const { yearId } = req.params;
  const index = academicYearsStore.findIndex(item => item.id === yearId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Academic year not found' });
    return;
  }

  const updated: AcademicYear = {
    ...academicYearsStore[index],
    ...req.body,
    isActive: req.body.isActive != null ? Boolean(req.body.isActive) : academicYearsStore[index].isActive,
    trimesters: Array.isArray(req.body.trimesters)
      ? req.body.trimesters.map((t: any) => ({
          id: t.id || crypto.randomUUID(),
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          isActive: Boolean(t.isActive)
        }))
      : academicYearsStore[index].trimesters
  };

  if (updated.isActive) {
    academicYearsStore = academicYearsStore.map(item => ({ ...item, isActive: false }));
  }

  academicYearsStore[index] = updated;
  res.json({ success: true, data: updated });
});

router.delete('/:yearId', authorize(['ADMIN']), (req, res) => {
  const { yearId } = req.params;
  const existing = academicYearsStore.find(item => item.id === yearId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Academic year not found' });
    return;
  }

  academicYearsStore = academicYearsStore.filter(item => item.id !== yearId);
  res.json({ success: true });
});

export default router;
