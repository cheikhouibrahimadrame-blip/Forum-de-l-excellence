import { api } from './api';
import { API } from './apiRoutes';
import {
  mapGradesToEntries,
  extractPeriod,
  type ReportCardEntry,
  type ReportCardCompositions,
  type ReportCardDecision,
  type ReportCardCouncilObservation,
} from '../components/reportcard';

// ============================================================
// reportCardClient
// ------------------------------------------------------------
// Thin wrapper around the `/api/report-cards` endpoints + the
// existing `/api/grades/student/:id` source-of-truth.
//
// `loadStudentBulletin` returns a *fully merged* bulletin:
//   - the raw entries computed from the Grade table
//   - merged with whatever the admin / teacher persisted in the
//     `ReportCardDraft` (per-subject grade override, max scale,
//     coefficient, appreciation) plus all bulletin-wide fields
//     (compositions, decision, council, attendance, etc.)
//
// Every page (Admin / Student / Teacher / Parent) hits this same
// helper so they stay in sync — admin saves → others see the
// new values on next refresh.
// ============================================================

export type SavedReportCard = {
  id: string;
  studentId: string;
  academicYearId: string;
  trimester: 1 | 2 | 3;
  gradeScale: 10 | 20;
  entries: ReportCardEntry[] | null;
  generalAppreciation: string | null;
  compositions: ReportCardCompositions | null;
  decision: ReportCardDecision | null;
  councilObservation: ReportCardCouncilObservation | null;
  attendance: { present?: number; absent?: number; late?: number } | null;
  updatedAt: string;
  updatedById: string | null;
};

export type MergedBulletin = {
  /** The student's grades-table-derived entries (computed). */
  computedEntries: ReportCardEntry[];
  /** Merged entries: persisted overrides win, fallback to computed. */
  entries: ReportCardEntry[];
  /** Period extracted from grades response (semester + year). */
  period: { trimester: string; academicYear?: string };
  /** Class name from grades response. */
  className: string;
  /** Saved draft (or null if nothing has been persisted yet). */
  saved: SavedReportCard | null;
};

/**
 * Fetch the saved draft. Returns `null` if the row doesn't exist
 * yet (or the user can't access it — the API answers 403 in that
 * case which we treat as "no draft" for the caller).
 */
export async function fetchReportCard(params: {
  studentId: string;
  yearId: string;
  trimester: 1 | 2 | 3;
}): Promise<SavedReportCard | null> {
  try {
    const res = await api.get(API.REPORT_CARDS, {
      params: {
        studentId: params.studentId,
        yearId: params.yearId,
        trimester: params.trimester,
      },
    });
    const data = res?.data?.data;
    if (!data) return null;
    return {
      id: data.id,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      trimester: data.trimester,
      gradeScale: data.gradeScale === 10 ? 10 : 20,
      entries: Array.isArray(data.entries) ? (data.entries as ReportCardEntry[]) : null,
      generalAppreciation: data.generalAppreciation ?? null,
      compositions: data.compositions ?? null,
      decision: data.decision ?? null,
      councilObservation: data.councilObservation ?? null,
      attendance: data.attendance ?? null,
      updatedAt: data.updatedAt,
      updatedById: data.updatedById ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the raw grades + the saved draft and produce a single
 * merged view. The merge rule for entries is:
 *   1. Start from the persisted `entries` if any.
 *   2. Otherwise use the computed-from-grades entries.
 *   3. If a persisted entry matches a computed one by `subject`,
 *      keep the persisted overrides but pull `teacher` from the
 *      computed side (since teacher names live in the Course
 *      relation, not in the bulletin draft).
 */
export async function loadStudentBulletin(args: {
  studentId: string;
  yearId: string;
  trimester: 1 | 2 | 3;
}): Promise<MergedBulletin> {
  const [gradesRes, saved] = await Promise.all([
    api
      .get(API.GRADES_BY_STUDENT(args.studentId))
      .then((r) => r.data)
      .catch(() => null),
    fetchReportCard(args),
  ]);

  const computedEntries = mapGradesToEntries(gradesRes);
  const period = extractPeriod(gradesRes);
  const className = gradesRes?.data?.className || '-';

  let entries: ReportCardEntry[];
  if (saved?.entries && saved.entries.length > 0) {
    // Map computed teachers by subject so we can re-attach them
    // even when admin edited the entries (teacher names aren't
    // editable in the bulletin draft).
    const teacherBySubject = new Map<string, string | undefined>();
    computedEntries.forEach((e) => teacherBySubject.set(e.subject, e.teacher));
    entries = saved.entries.map((e) => ({
      subject: e.subject,
      teacher: e.teacher || teacherBySubject.get(e.subject),
      grade: e.grade ?? null,
      maxGrade: e.maxGrade ?? 20,
      coefficient: e.coefficient || 1,
      appreciation: e.appreciation || undefined,
    }));
  } else {
    entries = computedEntries;
  }

  return {
    computedEntries,
    entries,
    period,
    className,
    saved,
  };
}

/**
 * Compute the weighted mean of the merged entries on the chosen
 * scale. Returns `null` if there are no valid grades yet.
 *
 *   pointsObtained = Σ(grade × coef)
 *   pointsTotal    = Σ(maxGrade × coef)
 *   average        = (pointsObtained / pointsTotal) × scale
 */
export function computeAverage(
  entries: ReportCardEntry[],
  scale: 10 | 20,
): number | null {
  const valid = entries.filter(
    (e) => e.grade !== null && !Number.isNaN(e.grade as number),
  );
  if (valid.length === 0) return null;
  const obtained = valid.reduce(
    (s, e) => s + (e.grade as number) * (e.coefficient || 1),
    0,
  );
  const total = valid.reduce(
    (s, e) => s + (e.maxGrade ?? 20) * (e.coefficient || 1),
    0,
  );
  if (total <= 0) return null;
  return (obtained / total) * scale;
}

/**
 * Map a raw average (on the scale) to a French school mention.
 * Always reasoned on /20 (we rescale primaire averages back).
 */
export function getMention(avg: number, scale: 10 | 20): string {
  const on20 = scale === 20 ? avg : (avg / scale) * 20;
  if (on20 >= 16) return 'Excellent';
  if (on20 >= 14) return 'Très Bien';
  if (on20 >= 12) return 'Bien';
  if (on20 >= 10) return 'Assez Bien';
  return 'Insuffisant';
}

/**
 * Persist the bulletin (admin = full, teacher = appreciations
 * merged server-side). Returns the saved draft so the caller can
 * refresh its local state with the canonical server values.
 */
export async function saveReportCard(payload: {
  studentId: string;
  yearId: string;
  trimester: 1 | 2 | 3;
  gradeScale?: 10 | 20;
  entries?: ReportCardEntry[];
  generalAppreciation?: string | null;
  compositions?: ReportCardCompositions | null;
  decision?: ReportCardDecision | null;
  councilObservation?: ReportCardCouncilObservation | null;
  attendance?: { present?: number; absent?: number; late?: number } | null;
}): Promise<SavedReportCard | null> {
  const res = await api.put(API.REPORT_CARDS, payload);
  const data = res?.data?.data;
  if (!data) return null;
  return {
    id: data.id,
    studentId: data.studentId,
    academicYearId: data.academicYearId,
    trimester: data.trimester,
    gradeScale: data.gradeScale === 10 ? 10 : 20,
    entries: Array.isArray(data.entries) ? (data.entries as ReportCardEntry[]) : null,
    generalAppreciation: data.generalAppreciation ?? null,
    compositions: data.compositions ?? null,
    decision: data.decision ?? null,
    councilObservation: data.councilObservation ?? null,
    attendance: data.attendance ?? null,
    updatedAt: data.updatedAt,
    updatedById: data.updatedById ?? null,
  };
}
