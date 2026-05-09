import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

// ============================================================
// reportCardController
// ------------------------------------------------------------
// API for the persisted bulletin payload (`ReportCardDraft`).
//
// Endpoints:
//   GET  /api/report-cards?studentId&yearId&trimester
//        → returns the saved draft (or null fields) for that key.
//   PUT  /api/report-cards
//        → upserts the draft. ADMIN can write every field;
//          TEACHER can only write `entries[].appreciation`
//          (other fields of incoming payload are ignored, and
//           the previous values are merge-preserved).
//
// Read access:
//   - ADMIN, TEACHER : any student
//   - STUDENT        : self only
//   - PARENT         : children only (via ParentStudent)
//
// All endpoints assume `authenticate` has populated `req.user`.
// ============================================================

type DraftEntry = {
  subject: string;
  teacher?: string | null;
  grade?: number | null;
  maxGrade?: number | null;
  coefficient: number;
  appreciation?: string | null;
};

type DraftPayload = {
  gradeScale?: 10 | 20 | number;
  entries?: DraftEntry[];
  generalAppreciation?: string | null;
  compositions?: {
    first?: number | null;
    second?: number | null;
    third?: number | null;
    annual?: number | null;
  } | null;
  decision?: 'promoted' | 'redoubling' | 'excluded' | null;
  councilObservation?:
    | 'congrats'
    | 'encouragement'
    | 'honor'
    | 'warning'
    | 'blame'
    | null;
  attendance?: {
    present?: number;
    absent?: number;
    late?: number;
  } | null;
};

const VALID_DECISIONS = new Set(['promoted', 'redoubling', 'excluded']);
const VALID_COUNCIL = new Set([
  'congrats',
  'encouragement',
  'honor',
  'warning',
  'blame',
]);

/**
 * Verify the requester has read access to this student's bulletin.
 * Returns `null` if allowed, otherwise the HTTP status + error to send.
 */
const checkReadAccess = async (
  req: AuthenticatedRequest,
  studentId: string,
): Promise<{ status: number; error: string } | null> => {
  const role = (req.user?.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'TEACHER') return null;

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    if (!student || student.id !== studentId) {
      return { status: 403, error: 'Accès refusé' };
    }
    return null;
  }

  if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: req.user!.id },
      include: { parentStudents: true },
    });
    if (
      !parent ||
      !parent.parentStudents.some((ps: any) => ps.studentId === studentId)
    ) {
      return { status: 403, error: 'Accès refusé' };
    }
    return null;
  }

  return { status: 403, error: 'Accès refusé' };
};

const parseTrimester = (raw: unknown): 1 | 2 | 3 | null => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n === 1 || n === 2 || n === 3) return n as 1 | 2 | 3;
  return null;
};

/**
 * GET /api/report-cards?studentId&yearId&trimester
 */
export const getReportCard = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.query.studentId || '').trim();
    const academicYearId = String(req.query.yearId || '').trim();
    const trimester = parseTrimester(req.query.trimester);

    if (!studentId || !academicYearId || trimester === null) {
      res.status(400).json({
        success: false,
        error: 'Paramètres requis : studentId, yearId, trimester (1,2,3)',
      });
      return;
    }

    const denial = await checkReadAccess(req, studentId);
    if (denial) {
      res.status(denial.status).json({ success: false, error: denial.error });
      return;
    }

    const draft = await (prisma as any).reportCardDraft.findUnique({
      where: {
        studentId_academicYearId_trimester: {
          studentId,
          academicYearId,
          trimester,
        },
      },
    });

    res.json({
      success: true,
      data: draft
        ? {
            id: draft.id,
            studentId: draft.studentId,
            academicYearId: draft.academicYearId,
            trimester: draft.trimester,
            gradeScale: draft.gradeScale,
            entries: draft.entries ?? null,
            generalAppreciation: draft.generalAppreciation ?? null,
            compositions: draft.compositions ?? null,
            decision: draft.decision ?? null,
            councilObservation: draft.councilObservation ?? null,
            attendance: draft.attendance ?? null,
            updatedAt: draft.updatedAt,
            updatedById: draft.updatedById ?? null,
          }
        : null,
    });
  } catch (error) {
    logger.error({ error }, 'getReportCard failed');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Sanitize the entries array — keep stable shape and prevent
 * arbitrary keys from sneaking through into the JSONB column.
 */
const sanitizeEntries = (raw: unknown): DraftEntry[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((e: any) => {
    const grade =
      e?.grade === null || e?.grade === undefined || e?.grade === ''
        ? null
        : Number(e.grade);
    const maxGrade =
      e?.maxGrade === null || e?.maxGrade === undefined || e?.maxGrade === ''
        ? null
        : Number(e.maxGrade);
    const coef = Number(e?.coefficient);
    return {
      subject: typeof e?.subject === 'string' ? e.subject : 'Matière',
      teacher: typeof e?.teacher === 'string' ? e.teacher : null,
      grade: Number.isFinite(grade as number) ? (grade as number) : null,
      maxGrade: Number.isFinite(maxGrade as number)
        ? (maxGrade as number)
        : null,
      coefficient: Number.isFinite(coef) && coef > 0 ? coef : 1,
      appreciation:
        typeof e?.appreciation === 'string' ? e.appreciation : null,
    };
  });
};

/**
 * PUT /api/report-cards
 * Body: { studentId, yearId, trimester, ...DraftPayload }
 *
 * Role-based field filtering:
 *   - ADMIN  : every field is writable.
 *   - TEACHER: only `entries[i].appreciation` is writable; we
 *              merge those onto the existing draft (or create a
 *              new draft initialised from the incoming entries
 *              shape if none exists yet).
 */
export const upsertReportCard = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      res.status(403).json({ success: false, error: 'Accès refusé' });
      return;
    }

    const studentId = String(req.body?.studentId || '').trim();
    const academicYearId = String(req.body?.yearId || '').trim();
    const trimester = parseTrimester(req.body?.trimester);

    if (!studentId || !academicYearId || trimester === null) {
      res.status(400).json({
        success: false,
        error: 'Champs requis : studentId, yearId, trimester (1,2,3)',
      });
      return;
    }

    // Verify the student/year actually exist (defensive — we get
    // FK errors otherwise, but a 404 is much friendlier).
    const [student, year] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, select: { id: true } }),
      (prisma as any).academicYear.findUnique({
        where: { id: academicYearId },
        select: { id: true },
      }),
    ]);
    if (!student) {
      res.status(404).json({ success: false, error: 'Élève introuvable' });
      return;
    }
    if (!year) {
      res
        .status(404)
        .json({ success: false, error: 'Année scolaire introuvable' });
      return;
    }

    const payload = (req.body || {}) as DraftPayload;
    const incomingEntries = sanitizeEntries(payload.entries);

    const existing = await (prisma as any).reportCardDraft.findUnique({
      where: {
        studentId_academicYearId_trimester: {
          studentId,
          academicYearId,
          trimester,
        },
      },
    });

    let nextData: any;

    if (role === 'ADMIN') {
      // Admin overwrites the entire bulletin payload.
      const decision =
        payload.decision && VALID_DECISIONS.has(payload.decision as string)
          ? payload.decision
          : null;
      const council =
        payload.councilObservation &&
        VALID_COUNCIL.has(payload.councilObservation as string)
          ? payload.councilObservation
          : null;
      const scale =
        Number(payload.gradeScale) === 10 ? 10 : Number(payload.gradeScale) === 20 ? 20 : 20;

      nextData = {
        gradeScale: scale,
        entries: incomingEntries ?? null,
        generalAppreciation:
          typeof payload.generalAppreciation === 'string'
            ? payload.generalAppreciation
            : null,
        compositions: payload.compositions ?? null,
        decision,
        councilObservation: council,
        attendance: payload.attendance ?? null,
        updatedById: req.user!.id,
      };
    } else {
      // TEACHER — merge only `appreciation` onto each entry by
      // matching `subject`. We start from the existing draft's
      // entries (canonical) or, if none, from the incoming
      // (which is what the teacher had loaded computed from
      // grades). All other top-level fields are preserved.
      const baseEntries: DraftEntry[] | null =
        (existing?.entries as DraftEntry[] | null) ?? incomingEntries ?? null;

      const apprBySubject = new Map<string, string | null>();
      (incomingEntries || []).forEach((e) => {
        if (typeof e.appreciation === 'string' || e.appreciation === null) {
          apprBySubject.set(e.subject, e.appreciation ?? null);
        }
      });

      const mergedEntries =
        baseEntries === null
          ? null
          : baseEntries.map((e) => {
              if (apprBySubject.has(e.subject)) {
                return { ...e, appreciation: apprBySubject.get(e.subject) ?? null };
              }
              return e;
            });

      nextData = {
        // Preserve everything admin-owned. Only update entries.
        gradeScale: existing?.gradeScale ?? 20,
        entries: mergedEntries,
        generalAppreciation: existing?.generalAppreciation ?? null,
        compositions: existing?.compositions ?? null,
        decision: existing?.decision ?? null,
        councilObservation: existing?.councilObservation ?? null,
        attendance: existing?.attendance ?? null,
        updatedById: req.user!.id,
      };
    }

    const saved = existing
      ? await (prisma as any).reportCardDraft.update({
          where: { id: existing.id },
          data: nextData,
        })
      : await (prisma as any).reportCardDraft.create({
          data: {
            studentId,
            academicYearId,
            trimester,
            ...nextData,
          },
        });

    res.json({
      success: true,
      data: {
        id: saved.id,
        studentId: saved.studentId,
        academicYearId: saved.academicYearId,
        trimester: saved.trimester,
        gradeScale: saved.gradeScale,
        entries: saved.entries ?? null,
        generalAppreciation: saved.generalAppreciation ?? null,
        compositions: saved.compositions ?? null,
        decision: saved.decision ?? null,
        councilObservation: saved.councilObservation ?? null,
        attendance: saved.attendance ?? null,
        updatedAt: saved.updatedAt,
        updatedById: saved.updatedById ?? null,
      },
    });
  } catch (error) {
    logger.error({ error }, 'upsertReportCard failed');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
