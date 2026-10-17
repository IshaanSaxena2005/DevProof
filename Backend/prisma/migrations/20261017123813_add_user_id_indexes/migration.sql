-- CreateIndex
CREATE INDEX "analysis_histories_userId_createdAt_idx" ON "analysis_histories"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "certifications_userId_idx" ON "certifications"("userId");
