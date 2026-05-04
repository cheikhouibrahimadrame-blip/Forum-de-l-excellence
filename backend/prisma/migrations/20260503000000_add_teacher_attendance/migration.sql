-- Adds the TeacherAttendance table for HR-style admin presence tracking
-- of teaching staff (separate from classroom-rollcall student attendance).
--
-- Idempotent (`IF NOT EXISTS`) so re-applying or running on a manually
-- patched database is safe.

-- CreateTable
CREATE TABLE IF NOT EXISTS "TeacherAttendance" (
    "id"         UUID                NOT NULL,
    "teacherId"  UUID                NOT NULL,
    "date"       DATE                NOT NULL,
    "status"     "AttendanceStatus"  NOT NULL,
    "markedById" UUID                NOT NULL,
    "remarks"    TEXT,
    "createdAt"  TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- One record per (teacher, day): re-marking the same day updates in place
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherAttendance_teacherId_date_key"
    ON "TeacherAttendance"("teacherId", "date");

-- Lookup indexes (mirror @@index on schema.prisma)
CREATE INDEX IF NOT EXISTS "TeacherAttendance_teacherId_idx"
    ON "TeacherAttendance"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAttendance_date_idx"
    ON "TeacherAttendance"("date");
CREATE INDEX IF NOT EXISTS "TeacherAttendance_markedById_idx"
    ON "TeacherAttendance"("markedById");

-- Foreign keys (guard with DO blocks so re-running is safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_teacherId_fkey'
    ) THEN
        ALTER TABLE "TeacherAttendance"
            ADD CONSTRAINT "TeacherAttendance_teacherId_fkey"
            FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_markedById_fkey'
    ) THEN
        ALTER TABLE "TeacherAttendance"
            ADD CONSTRAINT "TeacherAttendance_markedById_fkey"
            FOREIGN KEY ("markedById") REFERENCES "User"("id")
            ON DELETE NO ACTION ON UPDATE CASCADE;
    END IF;
END$$;
