-- P1-12: Add @@unique([studentId, courseId, assignmentName]) on Grade.
--
-- IMPORTANT: This migration assumes no duplicate (studentId, courseId,
-- assignmentName) tuples already exist in the Grade table. If your
-- production database contains historical duplicates, run a one-shot
-- cleanup query first (example below) and then re-apply this migration.
--
-- Example duplicate cleanup (review before running!):
--
--   DELETE FROM "Grade" g
--   USING "Grade" g2
--   WHERE g."studentId"      = g2."studentId"
--     AND g."courseId"       = g2."courseId"
--     AND g."assignmentName" = g2."assignmentName"
--     AND g."gradeDate"      < g2."gradeDate";  -- keep most recent
--

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_courseId_assignmentName_key"
  ON "Grade"("studentId", "courseId", "assignmentName");
