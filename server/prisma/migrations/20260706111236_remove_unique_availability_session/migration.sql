-- DropIndex
DROP INDEX "sessions_availabilityId_key";

-- CreateIndex
CREATE INDEX "sessions_availabilityId_idx" ON "sessions"("availabilityId");
