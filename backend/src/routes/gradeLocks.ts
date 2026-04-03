import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

type GradeLock = {
  id: string;
  period: string;
  reason?: string;
  lockedAt: string;
};

let gradeLocksStore: GradeLock[] = [];

router.use(authenticate);

router.get('/', authorize(['ADMIN']), (_req, res) => {
  res.json({ success: true, data: gradeLocksStore });
});

router.get('/summary', authorize(['ADMIN']), (_req, res) => {
  res.json({
    success: true,
    data: {
      completionRate: 0,
      openPeriods: 0,
      lockedPeriods: gradeLocksStore.length
    }
  });
});

router.post('/lock', authorize(['ADMIN']), (req, res) => {
  const { period, reason } = req.body;

  if (!period) {
    res.status(400).json({ success: false, error: 'Missing period' });
    return;
  }

  const newLock: GradeLock = {
    id: crypto.randomUUID(),
    period,
    reason,
    lockedAt: new Date().toISOString()
  };

  gradeLocksStore = [newLock, ...gradeLocksStore];
  res.status(201).json({ success: true, data: newLock });
});

router.delete('/:lockId', authorize(['ADMIN']), (req, res) => {
  const { lockId } = req.params;
  const existing = gradeLocksStore.find(item => item.id === lockId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Lock not found' });
    return;
  }

  gradeLocksStore = gradeLocksStore.filter(item => item.id !== lockId);
  res.json({ success: true });
});

export default router;
