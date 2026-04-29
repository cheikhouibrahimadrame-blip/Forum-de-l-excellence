import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../lib/prisma';

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

router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const years = await (prisma as any).academicYear.findMany({
      include: { trimesters: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des années scolaires' });
  }
});

router.post('/', authorize(['ADMIN']), async (req, res) => {
  const { year, startDate, endDate, isActive = false, trimesters = [] } = req.body;

  if (!year || !startDate || !endDate) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  try {
    const createData: any = {
      year: String(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: Boolean(isActive)
    };

    if (Array.isArray(trimesters) && trimesters.length > 0) {
      createData.trimesters = {
        create: trimesters.map((t: any) => ({
          name: String(t.name),
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
          isActive: Boolean(t.isActive)
        }))
      };
    }

    await prisma.$transaction(async (tx) => {
      if (createData.isActive) {
        await (tx as any).academicYear.updateMany({ where: {}, data: { isActive: false } });
      }
      const created = await (tx as any).academicYear.create({ data: createData, include: { trimesters: true } });
      res.status(201).json({ success: true, data: created });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l année scolaire' });
  }
});

router.put('/:yearId', authorize(['ADMIN']), async (req, res) => {
  const { yearId } = req.params;

  try {
    const existing = await (prisma as any).academicYear.findUnique({ where: { id: yearId }, include: { trimesters: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Academic year not found' });
      return;
    }

    const { year, startDate, endDate, isActive, trimesters } = req.body;

    await prisma.$transaction(async (tx) => {
      if (isActive) {
        await (tx as any).academicYear.updateMany({ where: {}, data: { isActive: false } });
      }

      const updated = await (tx as any).academicYear.update({
        where: { id: yearId },
        data: {
          year: year != null ? String(year) : undefined,
          startDate: startDate != null ? new Date(startDate) : undefined,
          endDate: endDate != null ? new Date(endDate) : undefined,
          isActive: isActive != null ? Boolean(isActive) : undefined
        }
      });

      if (Array.isArray(trimesters)) {
        // Simplest approach: delete existing trimesters and recreate
        await (tx as any).trimester.deleteMany({ where: { academicYearId: yearId } });
        if (trimesters.length > 0) {
          await (tx as any).trimester.createMany({ data: trimesters.map((t: any) => ({
            academicYearId: yearId,
            name: String(t.name),
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            isActive: Boolean(t.isActive)
          })) });
        }
      }

      const reloaded = await (tx as any).academicYear.findUnique({ where: { id: yearId }, include: { trimesters: true } });
      res.json({ success: true, data: reloaded });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de l année scolaire' });
  }
});

router.delete('/:yearId', authorize(['ADMIN']), async (req, res) => {
  const { yearId } = req.params;
  try {
    const existing = await prisma.academicYear.findUnique({ where: { id: yearId }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Academic year not found' });
      return;
    }

    await prisma.academicYear.delete({ where: { id: yearId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l année scolaire' });
  }
});

export default router;
