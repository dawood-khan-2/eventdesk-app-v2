-- Enable Row Level Security for guests table
ALTER TABLE public."guests" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for guests
CREATE POLICY guests_tenant_isolation ON public."guests"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));
