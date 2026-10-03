-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "courses_userId_idx" ON "courses"("userId");

