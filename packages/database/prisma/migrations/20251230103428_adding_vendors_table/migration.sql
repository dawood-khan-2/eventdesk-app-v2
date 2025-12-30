-- CreateTable
CREATE TABLE "vendors" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_services" (
    "tenantId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_tenantId_idx" ON "vendors"("tenantId");

-- CreateIndex
CREATE INDEX "vendor_services_vendorId_idx" ON "vendor_services"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_services_serviceId_idx" ON "vendor_services"("serviceId");

-- CreateIndex
CREATE INDEX "vendor_services_tenantId_idx" ON "vendor_services"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_services_vendorId_serviceId_key" ON "vendor_services"("vendorId", "serviceId");

-- AddForeignKey
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
