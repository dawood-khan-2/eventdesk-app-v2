-- Enable RLS for bills table
ALTER TABLE public."bills" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for bills
CREATE POLICY bills_tenant_isolation
  ON public."bills"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for vendors table
ALTER TABLE public."vendors" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for vendors
CREATE POLICY vendors_tenant_isolation
  ON public."vendors"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for vendor_services table
ALTER TABLE public."vendor_services" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for vendor_services
CREATE POLICY vendor_services_tenant_isolation
  ON public."vendor_services"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for payment_modes table
ALTER TABLE public."payment_modes" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for payment_modes
CREATE POLICY payment_modes_tenant_isolation
  ON public."payment_modes"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for payment_records table
ALTER TABLE public."payment_records" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for payment_records
CREATE POLICY payment_records_tenant_isolation
  ON public."payment_records"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for invoices table
ALTER TABLE public."invoices" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for invoices
CREATE POLICY invoices_tenant_isolation
  ON public."invoices"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

