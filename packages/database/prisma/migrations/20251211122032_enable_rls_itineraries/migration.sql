-- Enable RLS for itineraries
ALTER TABLE public."itineraries" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for itineraries
CREATE POLICY itineraries_tenant_isolation
  ON public."itineraries"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));