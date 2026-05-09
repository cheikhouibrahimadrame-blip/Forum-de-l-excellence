-- CreateTable
CREATE TABLE "ReportCardDraft" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "trimester" INTEGER NOT NULL,
    "gradeScale" INTEGER NOT NULL DEFAULT 20,
    "entries" JSONB,
    "generalAppreciation" TEXT,
    "compositions" JSONB,
    "decision" VARCHAR(20),
    "councilObservation" VARCHAR(20),
    "attendance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" UUID,

    CONSTRAINT "ReportCardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportCardDraft_studentId_academicYearId_trimester_key" ON "ReportCardDraft"("studentId", "academicYearId", "trimester");

-- CreateIndex
CREATE INDEX "ReportCardDraft_academicYearId_trimester_idx" ON "ReportCardDraft"("academicYearId", "trimester");

-- CreateIndex
CREATE INDEX "ReportCardDraft_studentId_idx" ON "ReportCardDraft"("studentId");

-- AddForeignKey
ALTER TABLE "ReportCardDraft" ADD CONSTRAINT "ReportCardDraft_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCardDraft" ADD CONSTRAINT "ReportCardDraft_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
