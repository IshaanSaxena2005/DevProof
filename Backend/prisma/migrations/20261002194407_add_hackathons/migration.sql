-- CreateTable
CREATE TABLE "hackathons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "role" TEXT,
    "projectName" TEXT,
    "projectUrl" TEXT,
    "result" TEXT,
    "teamSize" INTEGER,
    "technologies" JSONB,
    "heldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hackathons_userId_idx" ON "hackathons"("userId");

-- AddForeignKey
ALTER TABLE "hackathons" ADD CONSTRAINT "hackathons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

