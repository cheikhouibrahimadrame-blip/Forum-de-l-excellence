import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * GET /api/courses
 * Returns the list of active courses used by admin/teacher dropdowns
 * (schedule creation, grade entry, etc.).
 *
 * Shape:
 *   { success: true, data: [{ id, code, name, semester, year, teacher: { id, name } | null }] }
 */
router.get('/', authorize(['ADMIN', 'TEACHER']), async (_req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: [{ year: 'desc' }, { code: 'asc' }],
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    const data = courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      semester: c.semester,
      year: c.year,
      teacher: c.teacher
        ? {
            id: c.teacher.id,
            name: [c.teacher.user?.firstName, c.teacher.user?.lastName].filter(Boolean).join(' ')
          }
        : null
    }));

    res.json({ success: true, data });
  } catch (error) {
    logger.error({ error }, 'List courses error');
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des cours' });
  }
});

export default router;
