-- Enable RLS
ALTER TABLE public."events" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY events_tenant_isolation
  ON public."events"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));