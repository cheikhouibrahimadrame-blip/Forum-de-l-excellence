import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

let reportsStore: Array<{
  id: string;
  name: string;
  type: 'academic' | 'financial' | 'administrative';
  department: string;
  createdDate: string;
  generatedBy: string;
  recipients: number;
  status: 'draft' | 'published' | 'archived';
}> = [];

router.use(authenticate);

router.get('/', authorize(['ADMIN']), (_req, res) => {
  res.json({ success: true, data: reportsStore });
});

router.post('/', authorize(['ADMIN']), (req, res) => {
  const { name, type, department, generatedBy, recipients = 0, status = 'draft' } = req.body;

  if (!name || !type || !department || !generatedBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const newReport = {
    id: crypto.randomUUID(),
    name,
    type,
    department,
    createdDate: new Date().toISOString(),
    generatedBy,
    recipients: Number(recipients) || 0,
    status
  };

  reportsStore = [newReport, ...reportsStore];
  res.status(201).json({ success: true, data: newReport });
});

router.put('/:reportId', authorize(['ADMIN']), (req, res) => {
  const { reportId } = req.params;
  const index = reportsStore.findIndex(item => item.id === reportId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  const updated = {
    ...reportsStore[index],
    ...req.body,
    recipients: req.body.recipients != null ? Number(req.body.recipients) : reportsStore[index].recipients
  };

  reportsStore[index] = updated;
  res.json({ success: true, data: updated });
});

router.delete('/:reportId', authorize(['ADMIN']), (req, res) => {
  const { reportId } = req.params;
  const existing = reportsStore.find(item => item.id === reportId);

  if (!existing) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  reportsStore = reportsStore.filter(item => item.id !== reportId);
  res.json({ success: true });
});

export default router;
