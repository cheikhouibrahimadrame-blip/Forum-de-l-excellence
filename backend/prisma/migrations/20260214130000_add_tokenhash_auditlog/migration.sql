-- Enable required extension for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add tokenHash as nullable to allow backfill
ALTER TABLE "RefreshToken" ADD COLUMN "tokenHash" VARCHAR(128);

-- Backfill tokenHash from existing token values
UPDATE "RefreshToken"
SET "tokenHash" = encode(digest("token", 'sha256'), 'hex')
WHERE "tokenHash" IS NULL;

-- Drop legacy indexes and columns
DROP INDEX IF EXISTS "RefreshToken_token_key";
DROP INDEX IF EXISTS "RefreshToken_token_idx";

ALTER TABLE "RefreshToken" DROP COLUMN "token";
ALTER TABLE "RefreshToken" DROP COLUMN "isRevoked";

-- Enforce tokenHash requirement and new uniqueness
ALTER TABLE "RefreshToken" ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "RefreshToken_userId_tokenHash_key" ON "RefreshToken"("userId", "tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- Create AuditLog table
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes and FK
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
