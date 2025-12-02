-- Enable RLS for clients table
ALTER TABLE public."clients" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for clients
CREATE POLICY clients_tenant_isolation
  ON public."clients"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for estimates table
ALTER TABLE public."estimates" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for estimates
CREATE POLICY estimates_tenant_isolation
  ON public."estimates"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for service_categories table
ALTER TABLE public."service_categories" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for service_categories
CREATE POLICY service_categories_tenant_isolation
  ON public."service_categories"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));