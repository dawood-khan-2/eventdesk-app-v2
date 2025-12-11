-- Enable RLS for tasks
ALTER TABLE public."tasks" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for tasks
CREATE POLICY tasks_tenant_isolation
  ON public."tasks"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));

-- Enable RLS for checklists
ALTER TABLE public."checklists" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy for checklists
CREATE POLICY checklists_tenant_isolation
  ON public."checklists"
  USING ("tenantId" = current_setting('app.tenant_id'))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id'));
