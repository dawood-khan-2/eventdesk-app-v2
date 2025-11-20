-- Enable RLS
ALTER TABLE public."leads" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY leads_tenant_isolation
  ON public."leads"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));
