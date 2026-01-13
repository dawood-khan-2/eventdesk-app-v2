-- ============================================================================
-- Dashboard Demo Data Cleanup Script (INVERSE)
-- ============================================================================
-- This script removes all demo data inserted by seed-dashboard-demo.sql
--
-- IMPORTANT: Replace 'YOUR_TENANT_ID' with your actual organization ID
-- The same TENANT_ID used in the seed script
-- ============================================================================

-- Set your tenant ID here (REQUIRED - must match seed script)
-- Example: \set TENANT_ID 'clxxxxxxxxxxxx'

BEGIN;

-- ============================================================================
-- Delete in reverse order of dependencies
-- ============================================================================

-- Delete payment records
DELETE FROM payment_records WHERE "tenantId" = :'TENANT_ID' AND id IN (
  'pay_001', 'pay_002', 'pay_003', 'pay_004', 'pay_005', 'pay_006', 'pay_007'
);

-- Delete payment modes
DELETE FROM payment_modes WHERE "tenantId" = :'TENANT_ID' AND id IN (
  'pm_001', 'pm_002', 'pm_003', 'pm_004'
);

-- Delete bills (includes bills for upcoming events with estimates)
DELETE FROM bills WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'bill_%';

-- Delete estimates
DELETE FROM estimates WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'est_%';

-- Delete tasks
DELETE FROM tasks WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'task_%';

-- Delete events (including ongoing and this week events)
DELETE FROM events WHERE "tenantId" = :'TENANT_ID' AND (id LIKE 'event_%' OR id LIKE 'event_ongoing_%' OR id LIKE 'event_week_%');

-- Delete clients
DELETE FROM clients WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'client_%';

-- Delete leads
DELETE FROM leads WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'lead_%';

-- Delete vendor services (junction table)
DELETE FROM vendor_services WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'vs_%';

-- Delete vendors
DELETE FROM vendors WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'vendor_%';

-- Delete service categories
DELETE FROM service_categories WHERE "tenantId" = :'TENANT_ID' AND id LIKE 'cat_%';

COMMIT;

-- Display summary
SELECT '==== DEMO DATA CLEANUP COMPLETED ====' as status;
SELECT 'Remaining Leads: ' || COUNT(*) as summary FROM leads WHERE "tenantId" = :'TENANT_ID';
SELECT 'Remaining Clients: ' || COUNT(*) as summary FROM clients WHERE "tenantId" = :'TENANT_ID';
SELECT 'Remaining Events: ' || COUNT(*) as summary FROM events WHERE "tenantId" = :'TENANT_ID';
SELECT 'Remaining Tasks: ' || COUNT(*) as summary FROM tasks WHERE "tenantId" = :'TENANT_ID';
SELECT 'Remaining Bills: ' || COUNT(*) as summary FROM bills WHERE "tenantId" = :'TENANT_ID';
SELECT 'Remaining Vendors: ' || COUNT(*) as summary FROM vendors WHERE "tenantId" = :'TENANT_ID';

-- All counts should be 0 if cleanup was successful
