-- CreateTable
CREATE TABLE "payment_modes" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "payment_modes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_modes_tenantId_idx" ON "payment_modes"("tenantId");
