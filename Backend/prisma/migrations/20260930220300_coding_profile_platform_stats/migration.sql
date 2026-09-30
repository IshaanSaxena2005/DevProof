-- AlterTable
ALTER TABLE "coding_profiles" ADD COLUMN     "acceptanceRate" DOUBLE PRECISION,
ADD COLUMN     "contestsAttended" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "globalRanking" INTEGER,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "profileUrl" TEXT,
ADD COLUMN     "ranking" INTEGER,
ADD COLUMN     "rawStats" JSONB,
ADD COLUMN     "streakDays" INTEGER,
ADD COLUMN     "topPercentage" DOUBLE PRECISION,
ADD COLUMN     "totalActiveDays" INTEGER;

-- CreateIndex
CREATE INDEX "coding_profiles_userId_idx" ON "coding_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coding_profiles_userId_platform_key" ON "coding_profiles"("userId", "platform");

