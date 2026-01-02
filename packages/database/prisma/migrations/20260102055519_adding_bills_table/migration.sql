-- CreateTable
CREATE TABLE "bills" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceCategoryId" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bills_tenantId_idx" ON "bills"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "bills_vendorId_number_key" ON "bills"("vendorId", "number");

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
