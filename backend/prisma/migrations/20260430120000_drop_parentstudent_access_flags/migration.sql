-- P3-6: Drop the never-enforced ParentStudent access flags.
--
-- These two columns shipped with `@default(true)`, were hardcoded to
-- `true` on create, never settable via any admin endpoint or UI, and
-- never consulted by gradesController / scheduleController / the GPA
-- calculator. Keeping them in the schema is a footgun: any future
-- maintainer reading the model will assume they work.
--
-- This is a destructive migration. It is safe today because no caller
-- writes anything other than `true` to these columns and no caller
-- reads them — but if you maintain an out-of-band integration that
-- reads `canAccessGrades` / `canAccessSchedule`, treat this migration
-- as a contract change.

ALTER TABLE "ParentStudent" DROP COLUMN IF EXISTS "canAccessGrades";
ALTER TABLE "ParentStudent" DROP COLUMN IF EXISTS "canAccessSchedule";
