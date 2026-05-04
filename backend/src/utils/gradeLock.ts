import prisma from '../lib/prisma';

/**
 * P0-4: Grade-lock enforcement.
 *
 * The `GradeLock` table stores rows of the form `{ period: string }` where
 * `period` is matched against `Course.semester`. The admin UI exposes
 * `q1`/`q2`/`q3` (trimester keys) and `Course.semester` is a free-form
 * VARCHAR(20) — by convention they should agree. As long as the same
 * vocabulary is used on both sides, locking a period freezes every grade
 * mutation in courses with that semester value.
 *
 * Returns `true` when the (course's) period is locked, `false` otherwise.
 */
export const isCoursePeriodLocked = async (courseId: string): Promise<boolean> => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { semester: true }
  });
  if (!course?.semester) return false;
  const lock = await (prisma as any).gradeLock.findFirst({
    where: { period: course.semester },
    select: { id: true }
  });
  return !!lock;
};
