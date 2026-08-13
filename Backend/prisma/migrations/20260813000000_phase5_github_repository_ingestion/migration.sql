-- AlterTable
ALTER TABLE "github_accounts" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "totalFollowing" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "repositories" ADD COLUMN     "githubCreatedAt" TIMESTAMP(3),
ADD COLUMN     "githubRepoId" TEXT,
ADD COLUMN     "githubUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openIssuesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pushedAt" TIMESTAMP(3),
ADD COLUMN     "topics" JSONB,
ADD COLUMN     "watchersCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "repositories_userId_idx" ON "repositories"("userId");

-- CreateIndex
CREATE INDEX "repositories_githubRepoId_idx" ON "repositories"("githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_userId_fullName_key" ON "repositories"("userId", "fullName");

