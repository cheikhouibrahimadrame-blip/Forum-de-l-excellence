/*
  Warnings:

  - You are about to drop the column `classId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Homework` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "classId",
ADD COLUMN     "courseId" UUID;

-- AlterTable
ALTER TABLE "Homework" DROP COLUMN "classId",
ADD COLUMN     "courseId" UUID;

-- CreateIndex
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");

-- CreateIndex
CREATE INDEX "Homework_courseId_idx" ON "Homework"("courseId");
