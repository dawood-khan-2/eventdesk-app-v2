/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `balanceDue` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `payment_modes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "amountPaid",
DROP COLUMN "balanceDue",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "payment_modes" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "public"."InvoiceStatus";

-- CreateTable
CREATE TABLE "payment_records" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "billId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentModeId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_records_tenantId_idx" ON "payment_records"("tenantId");

-- CreateIndex
CREATE INDEX "payment_records_invoiceId_idx" ON "payment_records"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_records_billId_idx" ON "payment_records"("billId");

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_paymentModeId_fkey" FOREIGN KEY ("paymentModeId") REFERENCES "payment_modes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
