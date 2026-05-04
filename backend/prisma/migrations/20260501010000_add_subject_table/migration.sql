-- Adds the Subject table that schema.prisma has declared since
-- inception but no prior migration ever created. Without this table,
-- GET /api/subjects (and every dashboard that calls it) returns 500
-- with the silent message "Erreur lors du chargement des matières".
--
-- Idempotent (`IF NOT EXISTS`) so applying on a database that was
-- manually patched out-of-band doesn't break.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subject" (
    "id"          UUID         NOT NULL,
    "code"        VARCHAR(20)  NOT NULL,
    "name"        VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique on code, matches `@unique` in schema.prisma)
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_key" ON "Subject"("code");

-- CreateIndex (lookup index, matches `@@index([code])` in schema.prisma)
CREATE INDEX IF NOT EXISTS "Subject_code_idx" ON "Subject"("code");
