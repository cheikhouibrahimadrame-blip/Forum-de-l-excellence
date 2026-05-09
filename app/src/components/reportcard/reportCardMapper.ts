import type { ReportCardEntry } from './ReportCardA4';

// ============================================================
// Mapper unifié pour la réponse de GRADES_BY_STUDENT.
//
// Le backend (`/api/grades/student/:id`) retourne une structure
// `{ courses: [...] }` où chaque course expose soit un
// `finalGrade` global, soit une liste d'`assignments` qu'il
// faut moyenner. Cette fonction encapsule ce calcul, utilisée
// à l'identique par StudentReportCards, AdminBulletins et
// TeacherReportCardEditor.
//
// L'`appreciation` est récupérée depuis le 1er assignment qui
// a un `comments` non vide. Si plus tard on persiste une vraie
// appréciation par matière+trimestre dans un modèle dédié
// (cf. proposition `ReportCardEntry` côté Prisma), il suffira
// de modifier la résolution ici sans toucher aux pages.
// ============================================================

export interface GradesByStudentResponse {
  data?: {
    courses?: Array<{
      courseName?: string;
      courseCode?: string;
      teacher?: string;
      credits?: number;
      finalGrade?: number | string | null;
      assignments?: Array<{
        pointsEarned?: number | string | null;
        pointsPossible?: number | string | null;
        comments?: string | null;
        gradeDate?: string;
      }>;
    }>;
    semester?: string;
    year?: string | number;
    className?: string;
    overallPercentage?: number;
    currentGPA?: number;
  };
}

/**
 * Calcule la moyenne /20 d'un cours à partir de la réponse
 * backend. Priorité au `finalGrade` s'il existe, sinon
 * pondération sum(earned)/sum(possible) * 20.
 */
const courseAverage = (course: {
  finalGrade?: number | string | null;
  assignments?: Array<{
    pointsEarned?: number | string | null;
    pointsPossible?: number | string | null;
  }>;
}): number | null => {
  if (course.finalGrade != null && course.finalGrade !== '') {
    const v = Number(course.finalGrade);
    return Number.isNaN(v) ? null : v;
  }
  const assignments = Array.isArray(course.assignments) ? course.assignments : [];
  if (assignments.length === 0) return null;

  const totals = assignments.reduce(
    (acc, a) => {
      const earned = a.pointsEarned != null ? Number(a.pointsEarned) : 0;
      const possible = a.pointsPossible != null ? Number(a.pointsPossible) : 0;
      return {
        earned: acc.earned + (Number.isNaN(earned) ? 0 : earned),
        possible: acc.possible + (Number.isNaN(possible) ? 0 : possible),
      };
    },
    { earned: 0, possible: 0 },
  );

  if (totals.possible <= 0) return null;
  return (totals.earned / totals.possible) * 20;
};

/**
 * Récupère la 1re appréciation non-vide trouvée dans les
 * assignments du cours. Sert de valeur par défaut tant qu'on
 * n'a pas un champ "appréciation par matière+trimestre" en DB.
 */
const firstNonEmptyComment = (course: {
  assignments?: Array<{ comments?: string | null }>;
}): string | undefined => {
  const assignments = Array.isArray(course.assignments) ? course.assignments : [];
  for (const a of assignments) {
    if (a.comments && a.comments.trim().length > 0) return a.comments.trim();
  }
  return undefined;
};

/**
 * Transforme la réponse de `/api/grades/student/:id` en tableau
 * de `ReportCardEntry` directement injectables dans le
 * composant `<ReportCardA4 />`.
 *
 * Convention :
 *   - `grade` est normalisée sur 20 (compat student / teacher)
 *   - `maxGrade` est initialisé à 20 par défaut
 *
 * En mode admin éditable, l'admin peut ajuster `maxGrade` à
 * 40/35/24/etc. pour reproduire exactement le format sénégalais
 * (chaque matière avec son barème propre). Le composant
 * recalcule alors automatiquement TOTAL et MOYENNE.
 */
export function mapGradesToEntries(
  response: GradesByStudentResponse | null | undefined,
): ReportCardEntry[] {
  const courses = Array.isArray(response?.data?.courses) ? response!.data!.courses! : [];
  return courses.map((course) => {
    const avg = courseAverage(course);
    return {
      subject: course.courseName || course.courseCode || 'Matière',
      teacher: course.teacher || undefined,
      grade: avg === null ? null : Number(avg.toFixed(1)),
      maxGrade: 20,
      coefficient:
        course.credits && course.credits > 0 ? course.credits : 1,
      appreciation: firstNonEmptyComment(course),
    };
  });
}

/**
 * Construit l'objet `period` depuis la réponse API + fallbacks.
 */
export function extractPeriod(
  response: GradesByStudentResponse | null | undefined,
  fallbackTrimester = 'Période en cours',
): { trimester: string; academicYear?: string } {
  const semester = response?.data?.semester || fallbackTrimester;
  const year = response?.data?.year ? String(response.data.year) : undefined;
  return {
    trimester: semester,
    academicYear: year,
  };
}
