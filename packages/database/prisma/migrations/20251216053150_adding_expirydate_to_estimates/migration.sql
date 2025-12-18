-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "checklists_taskId_idx" ON "checklists"("taskId");

-- CreateIndex
CREATE INDEX "estimates_eventId_idx" ON "estimates"("eventId");

-- CreateIndex
CREATE INDEX "itineraries_eventId_idx" ON "itineraries"("eventId");

-- CreateIndex
CREATE INDEX "tasks_eventId_idx" ON "tasks"("eventId");
