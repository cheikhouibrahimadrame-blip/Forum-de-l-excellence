import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

type GradeLock = {
  id: string;
  period: string;
  reason?: string;
  lockedAt: string;
};

router.use(authenticate);

router.get('/', authorize(['ADMIN']), async (_req, res) => {
  try {
    const locks = await (prisma as any).gradeLock.findMany({ orderBy: { lockedAt: 'desc' } });
    res.json({ success: true, data: locks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des verrouillages' });
  }
});

router.get('/summary', authorize(['ADMIN']), async (_req, res) => {
  try {
    const lockedCount = await (prisma as any).gradeLock.count();
    res.json({ success: true, data: { completionRate: 0, openPeriods: 0, lockedPeriods: lockedCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du calcul du résumé' });
  }
});

router.post('/lock', authorize(['ADMIN']), async (req: any, res) => {
  const { period, reason } = req.body;

  if (!period) {
    res.status(400).json({ success: false, error: 'Missing period' });
    return;
  }

  try {
    const created = await (prisma as any).gradeLock.create({ data: {
      period: String(period),
      reason: reason ? String(reason) : null,
      createdBy: req.user?.id || null
    } });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la création du verrouillage' });
  }
});

router.delete('/:lockId', authorize(['ADMIN']), async (req, res) => {
  const { lockId } = req.params;
  try {
    const existing = await (prisma as any).gradeLock.findUnique({ where: { id: lockId }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Lock not found' });
      return;
    }
    await (prisma as any).gradeLock.delete({ where: { id: lockId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du verrouillage' });
  }
});

export default router;
