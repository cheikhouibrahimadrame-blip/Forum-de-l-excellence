import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import crypto from 'crypto';
import { loadJsonStore, saveJsonStore } from '../lib/jsonStore';

const router = Router();

type ReportItem = {
  id: string;
  name: string;
  type: 'academic' | 'financial' | 'administrative';
  department: string;
  createdDate: string;
  generatedBy: string;
  recipients: number;
  status: 'draft' | 'published' | 'archived';
};

const REPORTS_FILE = 'reports.json';
let reportsStore: ReportItem[] = loadJsonStore<ReportItem[]>(REPORTS_FILE, []);

const persistReports = () => {
  saveJsonStore(REPORTS_FILE, reportsStore);
};

const ALLOWED_REPORT_TYPES = new Set(['academic', 'financial', 'administrative']);
const ALLOWED_REPORT_STATUSES = new Set(['draft', 'published', 'archived']);

router.use(authenticate);

router.get('/', authorize(['ADMIN']), (_req, res) => {
  res.json({ success: true, data: reportsStore });
});

router.post('/', authorize(['ADMIN']), (req, res) => {
  const { name, type, department, generatedBy, recipients = 0, status = 'draft' } = req.body ?? {};

  if (!name || !type || !department || !generatedBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }
  if (!ALLOWED_REPORT_TYPES.has(type)) {
    res.status(400).json({ success: false, error: 'Type de rapport invalide' });
    return;
  }
  if (!ALLOWED_REPORT_STATUSES.has(status)) {
    res.status(400).json({ success: false, error: 'Statut de rapport invalide' });
    return;
  }

  const newReport: ReportItem = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    type,
    department: String(department).trim(),
    createdDate: new Date().toISOString(),
    generatedBy: String(generatedBy).trim(),
    recipients: Number(recipients) || 0,
    status
  };

  reportsStore = [newReport, ...reportsStore];
  persistReports();
  res.status(201).json({ success: true, data: newReport });
});

router.put('/:reportId', authorize(['ADMIN']), (req, res) => {
  const { reportId } = req.params;
  const index = reportsStore.findIndex(item => item.id === reportId);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Report not found' });
    return;
  }

  // P1-7: explicit field whitelist — never spread req.body.
  // This prevents overwriting `id`, `createdDate`, or injecting unknown fields.
  const { name, type, department, generatedBy, recipients, status } = req.body ?? {};

  if (type !== undefined && !ALLOWED_REPORT_TYPES.has(type)) {
    res.status(400).json({ success: false, error: 'Type de rapport invalide' });
    return;
  }
  if (status !== undefined && !ALLOWED_REPORT_STATUSES.has(status)) {
    res.status(400).json({ success: false, error: 'Statut de rapport invalide' });
    return;
  }

  const current = reportsStore[index];
  const updated: ReportItem = {
    ...current,
    ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(typeof department === 'string' && department.trim() ? { department: department.trim() } : {}),
    ...(typeof generatedBy === 'string' && generatedBy.trim() ? { generatedBy: generatedBy.trim() } : {}),
    ...(status !== undefined ? { status } : {}),
    recipients: recipients !== undefined && recipients !== null
      ? Number(recipients) || 0
      : current.recipients
  };

  reportsStore[index] = updated;
  persistReports();
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
  persistReports();
  res.json({ success: true });
});

export default router;
