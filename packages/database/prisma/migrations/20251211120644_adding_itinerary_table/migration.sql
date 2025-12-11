-- CreateTable
CREATE TABLE "itineraries" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itineraries_tenantId_idx" ON "itineraries"("tenantId");

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
