-- CreateTable
CREATE TABLE "SecretRotationAudit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rotationCount" INTEGER NOT NULL,
    "previousAccessSecret" TEXT NOT NULL,
    "currentAccessSecret" TEXT NOT NULL,
    "previousRefreshSecret" TEXT NOT NULL,
    "currentRefreshSecret" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(100) NOT NULL DEFAULT 'automatic_rotation',
    "rotatedBy" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretRotationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecretRotationAudit_rotatedAt_idx" ON "SecretRotationAudit"("rotatedAt");

-- CreateIndex
CREATE INDEX "SecretRotationAudit_reason_idx" ON "SecretRotationAudit"("reason");
