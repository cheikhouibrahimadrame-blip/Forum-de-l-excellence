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

/**
 * Compute the current Senegalese/French school year based on today's date.
 * - On or after September 1 → "<YYYY>-<YYYY+1>"
 * - Before September 1       → "<YYYY-1>-<YYYY>"
 */
const computeCurrentSchoolYear = (): { label: string; startDate: Date; endDate: Date } => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, 8 = September
  const y = now.getFullYear();
  const startYear = month >= 8 ? y : y - 1;
  return {
    label: `${startYear}-${startYear + 1}`,
    startDate: new Date(Date.UTC(startYear, 8, 1)),     // Sept 1
    endDate: new Date(Date.UTC(startYear + 1, 6, 15))   // Jul 15 next year
  };
};

/**
 * Ensure at least one academic year exists. Returns the (possibly newly created) default year.
 * Safe to call concurrently: if another request creates it first, we surface whichever
 * row already exists instead of crashing on a unique violation.
 */
const ensureDefaultAcademicYear = async (): Promise<void> => {
  try {
    const count = await (prisma as any).academicYear.count();
    if (count > 0) return;

    const { label, startDate, endDate } = computeCurrentSchoolYear();

    // Default 3 trimesters: Sept-Dec, Jan-Mar, Apr-Jul
    const y = startDate.getUTCFullYear();
    const defaultTrimesters = [
      { name: 'Trimestre 1', startDate: new Date(Date.UTC(y, 8, 1)),  endDate: new Date(Date.UTC(y, 11, 20)), isActive: true },
      { name: 'Trimestre 2', startDate: new Date(Date.UTC(y + 1, 0, 6)), endDate: new Date(Date.UTC(y + 1, 2, 31)), isActive: false },
      { name: 'Trimestre 3', startDate: new Date(Date.UTC(y + 1, 3, 15)), endDate: new Date(Date.UTC(y + 1, 6, 15)), isActive: false }
    ];

    await (prisma as any).academicYear.create({
      data: {
        year: label,
        startDate,
        endDate,
        isActive: true,
        trimesters: { create: defaultTrimesters }
      }
    });
  } catch (error: any) {
    // Unique-violation race: another request already seeded. Not fatal.
    if (error?.code !== 'P2002') {
      throw error;
    }
  }
};

router.get('/', async (_req, res) => {
  try {
    await ensureDefaultAcademicYear();

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
