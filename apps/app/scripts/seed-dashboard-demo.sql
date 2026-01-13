-- ============================================================================
-- Dashboard Demo Data Seed Script
-- ============================================================================
-- This script populates the database with comprehensive demo data to showcase
-- all dashboard features including Task Overview, Finance Overview, and
-- Client Engagement sections.
--
-- IMPORTANT: Replace 'YOUR_TENANT_ID' with your actual organization ID
-- You can find it by running: SELECT id, name FROM organizations;
-- ============================================================================

-- Set your tenant ID here (REQUIRED - get from organizations table)
-- Example: \set TENANT_ID 'clxxxxxxxxxxxx'

-- ============================================================================
-- BEGIN TRANSACTION
-- ============================================================================
-- All inserts are wrapped in a single transaction. If any error occurs,
-- the entire operation will be rolled back automatically (no partial data).
-- ============================================================================

BEGIN;

-- ============================================================================
-- SERVICE CATEGORIES (for bills and vendors)
-- ============================================================================
INSERT INTO service_categories ("tenantId", id, name) VALUES
  (:'TENANT_ID', 'cat_catering_001', 'Catering'),
  (:'TENANT_ID', 'cat_venue_002', 'Venue Rental'),
  (:'TENANT_ID', 'cat_av_003', 'Audio/Visual Equipment'),
  (:'TENANT_ID', 'cat_decor_004', 'Decorations'),
  (:'TENANT_ID', 'cat_photo_005', 'Photography'),
  (:'TENANT_ID', 'cat_music_006', 'Entertainment/Music'),
  (:'TENANT_ID', 'cat_transport_007', 'Transportation'),
  (:'TENANT_ID', 'cat_printing_008', 'Printing/Signage');

-- ============================================================================
-- VENDORS (with various payment statuses)
-- ============================================================================
INSERT INTO vendors ("tenantId", id, "companyName", "contactName", email, phone, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'vendor_001', 'Elite Catering Co.', 'Sarah Johnson', 'sarah@elitecatering.com', '+1-555-0101', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_002', 'Grand Ballroom Events', 'Michael Chen', 'michael@grandballroom.com', '+1-555-0102', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_003', 'ProSound AV Solutions', 'David Martinez', 'david@prosound.com', '+1-555-0103', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_004', 'Elegant Designs & Decor', 'Emily Wilson', 'emily@elegantdesigns.com', '+1-555-0104', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_005', 'Lens Perfect Photography', 'James Anderson', 'james@lensperfect.com', '+1-555-0105', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_006', 'Harmonic Entertainment', 'Lisa Thompson', 'lisa@harmonic.com', '+1-555-0106', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_007', 'Swift Transport Services', 'Robert Brown', 'robert@swifttransport.com', '+1-555-0107', NOW(), NOW()),
  (:'TENANT_ID', 'vendor_008', 'PrintPro Signage', 'Jennifer Davis', 'jennifer@printpro.com', '+1-555-0108', NOW(), NOW());

-- Link vendors to their service categories
INSERT INTO vendor_services ("tenantId", id, "vendorId", "serviceId", "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'vs_001', 'vendor_001', 'cat_catering_001', NOW(), NOW()),
  (:'TENANT_ID', 'vs_002', 'vendor_002', 'cat_venue_002', NOW(), NOW()),
  (:'TENANT_ID', 'vs_003', 'vendor_003', 'cat_av_003', NOW(), NOW()),
  (:'TENANT_ID', 'vs_004', 'vendor_004', 'cat_decor_004', NOW(), NOW()),
  (:'TENANT_ID', 'vs_005', 'vendor_005', 'cat_photo_005', NOW(), NOW()),
  (:'TENANT_ID', 'vs_006', 'vendor_006', 'cat_music_006', NOW(), NOW()),
  (:'TENANT_ID', 'vs_007', 'vendor_007', 'cat_transport_007', NOW(), NOW()),
  (:'TENANT_ID', 'vs_008', 'vendor_008', 'cat_printing_008', NOW(), NOW());

-- ============================================================================
-- LEADS (for funnel demonstration - current quarter)
-- ============================================================================
INSERT INTO leads ("tenantId", id, name, email, phone, company, status, "createdAt", "updatedAt", notes) VALUES
  -- NEW leads (8) - Entry point of funnel
  (:'TENANT_ID', 'lead_new_001', 'Alexandra Smith', 'alex.smith@techcorp.com', '+1-555-1001', 'TechCorp Inc.', 'NEW', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'Interested in annual company gala'),
  (:'TENANT_ID', 'lead_new_002', 'Brian Taylor', 'brian@startupxyz.com', '+1-555-1002', 'StartupXYZ', 'NEW', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'Product launch event'),
  (:'TENANT_ID', 'lead_new_003', 'Catherine Lee', 'clee@finance.com', '+1-555-1003', 'Finance Corp', 'NEW', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'Q1 networking event'),
  (:'TENANT_ID', 'lead_new_004', 'Daniel Park', 'dpark@healthcare.org', '+1-555-1004', 'Healthcare Plus', 'NEW', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'Medical conference'),
  (:'TENANT_ID', 'lead_new_005', 'Emma Watson', 'ewatson@retail.com', '+1-555-1005', 'Retail Innovations', 'NEW', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'Store opening celebration'),
  (:'TENANT_ID', 'lead_new_006', 'Samuel Chen', 'samuel@manufacturing.com', '+1-555-1019', 'Chen Manufacturing', 'NEW', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'Factory anniversary event'),
  (:'TENANT_ID', 'lead_new_007', 'Victoria Brown', 'victoria@consulting.biz', '+1-555-1020', 'Brown Consulting Group', 'NEW', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'Leadership summit'),
  (:'TENANT_ID', 'lead_new_008', 'William Garcia', 'william@nonprofit.org', '+1-555-1021', 'Community Foundation', 'NEW', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'Annual fundraising gala'),
  
  -- CONTACTED leads (7) - ~88% progression from NEW
  (:'TENANT_ID', 'lead_contacted_001', 'Frank Miller', 'frank@legal.com', '+1-555-1006', 'Miller & Associates', 'CONTACTED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', 'Law firm anniversary'),
  (:'TENANT_ID', 'lead_contacted_002', 'Grace Kim', 'grace@design.io', '+1-555-1007', 'Design Studio', 'CONTACTED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days', 'Portfolio showcase event'),
  (:'TENANT_ID', 'lead_contacted_003', 'Henry Zhang', 'henry@manufacturing.com', '+1-555-1008', 'Zhang Manufacturing', 'CONTACTED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days', 'Factory opening ceremony'),
  (:'TENANT_ID', 'lead_contacted_004', 'Isabel Rodriguez', 'isabel@edu.org', '+1-555-1009', 'Education Foundation', 'CONTACTED', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', 'Fundraising gala'),
  (:'TENANT_ID', 'lead_contacted_005', 'Thomas Wilson', 'thomas@tech.io', '+1-555-1022', 'Wilson Technologies', 'CONTACTED', NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days', 'Product demo day'),
  (:'TENANT_ID', 'lead_contacted_006', 'Jennifer Martinez', 'jennifer@realestate.com', '+1-555-1023', 'Martinez Properties', 'CONTACTED', NOW() - INTERVAL '11 days', NOW() - INTERVAL '8 days', 'Client appreciation event'),
  (:'TENANT_ID', 'lead_contacted_007', 'Robert Anderson', 'robert@finance.biz', '+1-555-1024', 'Anderson Financial', 'CONTACTED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', 'Investment conference'),
  
  -- PROPOSAL_SENT leads (6) - ~86% progression from CONTACTED (all within current quarter)
  (:'TENANT_ID', 'lead_proposal_001', 'Jack Thompson', 'jack@realestate.com', '+1-555-1010', 'Thompson Realty', 'PROPOSAL_SENT', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', 'Property investor conference'),
  (:'TENANT_ID', 'lead_proposal_002', 'Karen White', 'karen@pharma.com', '+1-555-1011', 'PharmaCorp', 'PROPOSAL_SENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days', 'Research symposium'),
  (:'TENANT_ID', 'lead_proposal_003', 'Leo Martinez', 'leo@consulting.biz', '+1-555-1012', 'Martinez Consulting', 'PROPOSAL_SENT', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days', 'Client appreciation dinner'),
  (:'TENANT_ID', 'lead_proposal_004', 'Patricia Davis', 'patricia@healthcare.org', '+1-555-1025', 'Davis Medical Center', 'PROPOSAL_SENT', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', 'Medical symposium'),
  (:'TENANT_ID', 'lead_proposal_005', 'Christopher Lee', 'chris@automotive.com', '+1-555-1026', 'Lee Auto Group', 'PROPOSAL_SENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'Dealership grand opening'),
  (:'TENANT_ID', 'lead_proposal_006', 'Amanda Taylor', 'amanda@hospitality.com', '+1-555-1027', 'Taylor Hotels', 'PROPOSAL_SENT', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days', 'Hotel chain conference'),
  
  -- FOLLOW_UP leads (5) - ~83% progression from PROPOSAL_SENT (all within current quarter)
  (:'TENANT_ID', 'lead_followup_001', 'Monica Harris', 'monica@insurance.com', '+1-555-1013', 'Harris Insurance', 'FOLLOW_UP', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', 'Annual awards ceremony'),
  (:'TENANT_ID', 'lead_followup_002', 'Nathan Brooks', 'nathan@logistics.com', '+1-555-1014', 'Brooks Logistics', 'FOLLOW_UP', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days', 'Warehouse expansion celebration'),
  (:'TENANT_ID', 'lead_followup_003', 'Sarah Thompson', 'sarah@legal.biz', '+1-555-1028', 'Thompson Law Firm', 'FOLLOW_UP', NOW() - INTERVAL '13 days', NOW() - INTERVAL '11 days', 'Firm anniversary gala'),
  (:'TENANT_ID', 'lead_followup_004', 'Michael Johnson', 'michael@construction.com', '+1-555-1029', 'Johnson Construction', 'FOLLOW_UP', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', 'Project completion celebration'),
  (:'TENANT_ID', 'lead_followup_005', 'Elizabeth Moore', 'elizabeth@retail.biz', '+1-555-1030', 'Moore Retail Group', 'FOLLOW_UP', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days', 'Store network expansion event'),
  
  -- CONVERTED leads (4) - 80% progression from FOLLOW_UP, ~13% overall conversion (all within current quarter)
  (:'TENANT_ID', 'lead_converted_001', 'Olivia Green', 'olivia@nonprofit.org', '+1-555-1015', 'Green Foundation', 'CONVERTED', NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', 'Charity auction event'),
  (:'TENANT_ID', 'lead_converted_002', 'Peter Johnson', 'peter@automotive.com', '+1-555-1016', 'Johnson Auto Group', 'CONVERTED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', 'New dealership opening'),
  (:'TENANT_ID', 'lead_converted_003', 'David Miller', 'david@tech.io', '+1-555-1031', 'Miller Tech Solutions', 'CONVERTED', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', 'Company milestone celebration'),
  (:'TENANT_ID', 'lead_converted_004', 'Jessica White', 'jessica@education.org', '+1-555-1032', 'White Academy', 'CONVERTED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'School anniversary event'),
  
  -- LOST leads (2 - for realistic conversion rate, all within current quarter)
  (:'TENANT_ID', 'lead_lost_001', 'Quinn Adams', 'quinn@hospitality.com', '+1-555-1017', 'Adams Hotels', 'LOST', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 'Budget constraints'),
  (:'TENANT_ID', 'lead_lost_002', 'Rachel Cooper', 'rachel@tech.io', '+1-555-1018', 'Cooper Tech', 'LOST', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', 'Chose different vendor');

-- ============================================================================
-- CLIENTS (including repeat clients and converted leads)
-- ============================================================================
INSERT INTO clients ("tenantId", id, "leadId", name, email, phone, company, "createdAt", "updatedAt", notes) VALUES
  -- Repeat Client #1 (5 events in past year)
  (:'TENANT_ID', 'client_repeat_001', NULL, 'Acme Corporation', 'events@acmecorp.com', '+1-555-2001', 'Acme Corp', NOW() - INTERVAL '2 years', NOW(), 'VIP client - quarterly events'),
  
  -- Repeat Client #2 (4 events in past year)
  (:'TENANT_ID', 'client_repeat_002', NULL, 'Global Ventures Ltd', 'admin@globalventures.com', '+1-555-2002', 'Global Ventures', NOW() - INTERVAL '18 months', NOW(), 'International conferences'),
  
  -- Repeat Client #3 (3 events in past year)
  (:'TENANT_ID', 'client_repeat_003', NULL, 'Bright Future Schools', 'contact@brightfuture.edu', '+1-555-2003', 'Bright Future', NOW() - INTERVAL '15 months', NOW(), 'Educational institution'),
  
  -- Repeat Client #4 (3 events in past year)
  (:'TENANT_ID', 'client_repeat_004', NULL, 'Premier Bank', 'events@premierbank.com', '+1-555-2004', 'Premier Bank', NOW() - INTERVAL '20 months', NOW(), 'Corporate banking events'),
  
  -- Repeat Client #5 (2 events in past year)
  (:'TENANT_ID', 'client_repeat_005', NULL, 'Creative Agency Co', 'hello@creativeagency.com', '+1-555-2005', 'Creative Agency', NOW() - INTERVAL '13 months', NOW(), 'Marketing and creative events'),
  
  -- One-time clients (6 - for realistic repeat client percentage)
  (:'TENANT_ID', 'client_onetime_001', NULL, 'Smith Family Reunion', 'john.smith@email.com', '+1-555-2006', NULL, NOW() - INTERVAL '8 months', NOW(), 'Personal event'),
  (:'TENANT_ID', 'client_onetime_002', NULL, 'Johnson Wedding', 'sarah.johnson@email.com', '+1-555-2007', NULL, NOW() - INTERVAL '5 months', NOW(), 'Wedding ceremony'),
  (:'TENANT_ID', 'client_onetime_003', NULL, 'Tech Startup Launch', 'founder@startup.com', '+1-555-2008', 'InnovateTech', NOW() - INTERVAL '3 months', NOW(), 'One-time launch event'),
  (:'TENANT_ID', 'client_onetime_004', NULL, 'Community Festival', 'organizer@festival.org', '+1-555-2009', NULL, NOW() - INTERVAL '6 months', NOW(), 'Annual community event'),
  (:'TENANT_ID', 'client_onetime_005', NULL, 'Birthday Celebration', 'party@email.com', '+1-555-2010', NULL, NOW() - INTERVAL '4 months', NOW(), 'Milestone birthday'),
  (:'TENANT_ID', 'client_onetime_006', NULL, 'Product Demo Day', 'demo@company.com', '+1-555-2011', 'Demo Inc', NOW() - INTERVAL '2 months', NOW(), 'Product demonstration'),
  
  -- Recently converted leads (now 4 clients from converted leads, dates match lead conversion)
  (:'TENANT_ID', 'client_from_lead_001', 'lead_converted_001', 'Green Foundation', 'olivia@nonprofit.org', '+1-555-1015', 'Green Foundation', NOW() - INTERVAL '12 days', NOW(), 'Converted from lead'),
  (:'TENANT_ID', 'client_from_lead_002', 'lead_converted_002', 'Johnson Auto Group', 'peter@automotive.com', '+1-555-1016', 'Johnson Auto Group', NOW() - INTERVAL '11 days', NOW(), 'Converted from lead'),
  (:'TENANT_ID', 'client_from_lead_003', 'lead_converted_003', 'Miller Tech Solutions', 'david@tech.io', '+1-555-1031', 'Miller Tech Solutions', NOW() - INTERVAL '10 days', NOW(), 'Converted from lead'),
  (:'TENANT_ID', 'client_from_lead_004', 'lead_converted_004', 'White Academy', 'jessica@education.org', '+1-555-1032', 'White Academy', NOW() - INTERVAL '9 days', NOW(), 'Converted from lead');

-- ============================================================================
-- EVENTS (spanning past year + upcoming events)
-- ============================================================================

-- Repeat Client #1 Events (5 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_r1_01', 'client_repeat_001', 'Acme Q1 2025 Leadership Summit', 'Downtown Convention Center', NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months' + INTERVAL '2 days', 5, 'Outstanding event execution!', NOW() - INTERVAL '11 months', NOW()),
  (:'TENANT_ID', 'event_r1_02', 'client_repeat_001', 'Acme Q2 2025 Sales Conference', 'Hilton Conference Hall', NOW() - INTERVAL '7 months', NOW() - INTERVAL '7 months' + INTERVAL '1 day', 5, 'Exceeded expectations', NOW() - INTERVAL '8 months', NOW()),
  (:'TENANT_ID', 'event_r1_03', 'client_repeat_001', 'Acme Q3 2025 Product Launch', 'Innovation Center', NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months' + INTERVAL '1 day', 4, 'Great venue selection', NOW() - INTERVAL '5 months', NOW()),
  (:'TENANT_ID', 'event_r1_04', 'client_repeat_001', 'Acme Q4 2025 Holiday Gala', 'Grand Ballroom', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month' + INTERVAL '1 day', 5, 'Perfect ending to the year', NOW() - INTERVAL '2 months', NOW()),
  (:'TENANT_ID', 'event_r1_05', 'client_repeat_001', 'Acme Q1 2026 Strategy Meeting', 'Skyline Hotel', NOW() + INTERVAL '15 days', NOW() + INTERVAL '17 days', NULL, NULL, NOW() - INTERVAL '1 month', NOW());

-- Repeat Client #2 Events (4 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_r2_01', 'client_repeat_002', 'Global Ventures Annual Conference', 'International Expo Center', NOW() - INTERVAL '9 months', NOW() - INTERVAL '9 months' + INTERVAL '3 days', 5, 'Seamless coordination', NOW() - INTERVAL '10 months', NOW()),
  (:'TENANT_ID', 'event_r2_02', 'client_repeat_002', 'Global Ventures Investor Meeting', 'Finance Tower', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months' + INTERVAL '1 day', 4, 'Professional service', NOW() - INTERVAL '7 months', NOW()),
  (:'TENANT_ID', 'event_r2_03', 'client_repeat_002', 'Global Ventures Team Building', 'Mountain Resort', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months' + INTERVAL '2 days', 5, 'Memorable experience', NOW() - INTERVAL '4 months', NOW()),
  (:'TENANT_ID', 'event_r2_04', 'client_repeat_002', 'Global Ventures Q1 Kickoff', 'Harbor Convention Center', NOW() + INTERVAL '8 days', NOW() + INTERVAL '9 days', NULL, NULL, NOW() - INTERVAL '2 weeks', NOW());

-- Repeat Client #3 Events (3 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_r3_01', 'client_repeat_003', 'Bright Future Teachers Conference', 'Education Center', NOW() - INTERVAL '8 months', NOW() - INTERVAL '8 months' + INTERVAL '2 days', 4, 'Well organized', NOW() - INTERVAL '9 months', NOW()),
  (:'TENANT_ID', 'event_r3_02', 'client_repeat_003', 'Bright Future Student Awards Ceremony', 'School Auditorium', NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months' + INTERVAL '1 day', 5, 'Inspiring event', NOW() - INTERVAL '6 months', NOW()),
  (:'TENANT_ID', 'event_r3_03', 'client_repeat_003', 'Bright Future Alumni Reunion', 'Campus Grounds', NOW() + INTERVAL '20 days', NOW() + INTERVAL '21 days', NULL, NULL, NOW() - INTERVAL '1 month', NOW());

-- Repeat Client #4 Events (3 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_r4_01', 'client_repeat_004', 'Premier Bank Leadership Retreat', 'Lakeside Resort', NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months' + INTERVAL '2 days', 5, 'Excellent venue and service', NOW() - INTERVAL '11 months', NOW()),
  (:'TENANT_ID', 'event_r4_02', 'client_repeat_004', 'Premier Bank Customer Appreciation', 'Downtown Branch', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months' + INTERVAL '1 day', 4, 'Good turnout', NOW() - INTERVAL '7 months', NOW()),
  (:'TENANT_ID', 'event_r4_03', 'client_repeat_004', 'Premier Bank Annual Shareholders Meeting', 'Corporate HQ', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days', NULL, NULL, NOW() - INTERVAL '3 weeks', NOW());

-- Repeat Client #5 Events (2 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_r5_01', 'client_repeat_005', 'Creative Agency Portfolio Showcase', 'Art Gallery', NOW() - INTERVAL '7 months', NOW() - INTERVAL '7 months' + INTERVAL '1 day', 5, 'Creative and elegant', NOW() - INTERVAL '8 months', NOW()),
  (:'TENANT_ID', 'event_r5_02', 'client_repeat_005', 'Creative Agency Client Mixer', 'Rooftop Venue', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days', NULL, NULL, NOW() - INTERVAL '2 weeks', NOW());

-- One-time Client Events (6 events)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_ot_01', 'client_onetime_001', 'Smith Family Reunion 2025', 'Community Park', NOW() - INTERVAL '8 months', NOW() - INTERVAL '8 months' + INTERVAL '1 day', 4, 'Nice family gathering', NOW() - INTERVAL '9 months', NOW()),
  (:'TENANT_ID', 'event_ot_02', 'client_onetime_002', 'Sarah & Michael Wedding', 'Garden Estate', NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months' + INTERVAL '1 day', 5, 'Magical wedding day', NOW() - INTERVAL '6 months', NOW()),
  (:'TENANT_ID', 'event_ot_03', 'client_onetime_003', 'InnovateTech Product Launch', 'Tech Hub', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months' + INTERVAL '1 day', 4, 'Successful launch', NOW() - INTERVAL '4 months', NOW()),
  (:'TENANT_ID', 'event_ot_04', 'client_onetime_004', 'Summer Community Festival 2025', 'City Plaza', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months' + INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '7 months', NOW()),
  (:'TENANT_ID', 'event_ot_05', 'client_onetime_005', '50th Birthday Celebration', 'Private Restaurant', NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months' + INTERVAL '1 day', 5, 'Memorable celebration', NOW() - INTERVAL '5 months', NOW()),
  (:'TENANT_ID', 'event_ot_06', 'client_onetime_006', 'Product Demo Day 2025', 'Business Center', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months' + INTERVAL '1 day', 4, 'Professional setup', NOW() - INTERVAL '3 months', NOW());

-- Recently converted lead events
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_new_01', 'client_from_lead_001', 'Green Foundation Charity Auction', 'Grand Hotel', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days', NULL, NULL, NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'event_new_02', 'client_from_lead_002', 'Johnson Auto Dealership Opening', 'Dealership Showroom', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', NULL, NULL, NOW() - INTERVAL '15 days', NOW());

-- ONGOING EVENTS (currently happening - startDate in past, endDate in future)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_ongoing_01', 'client_repeat_001', 'Acme Product Training Workshop', 'Corporate Training Center', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '15 days', NOW()),
  (:'TENANT_ID', 'event_ongoing_02', 'client_repeat_002', 'Global Ventures Innovation Summit', 'Tech Convention Center', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', NULL, NULL, NOW() - INTERVAL '20 days', NOW());

-- EVENTS THIS WEEK (starting within next 7 days)
INSERT INTO events ("tenantId", id, "clientId", name, venue, "startDate", "endDate", rating, comments, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'event_week_01', 'client_repeat_003', 'Bright Future Parent-Teacher Conference', 'School Campus', NOW() + INTERVAL '2 days', NOW() + INTERVAL '3 days', NULL, NULL, NOW() - INTERVAL '14 days', NOW()),
  (:'TENANT_ID', 'event_week_02', 'client_repeat_004', 'Premier Bank Branch Manager Training', 'Regional Office', NOW() + INTERVAL '5 days', NOW() + INTERVAL '6 days', NULL, NULL, NOW() - INTERVAL '12 days', NOW());

-- ============================================================================
-- TASKS (for Task Overview - various statuses, overdue, and idle)
-- ============================================================================

-- Event: Acme Q1 2026 Strategy Meeting (event_r1_05) - UPCOMING
-- Total: 12 tasks, 5 open (42%), 3 overdue, 2 idle
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_e1_01', 'event_r1_05', 'Book conference room', 'Reserve main conference room', NOW() - INTERVAL '5 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
  (:'TENANT_ID', 'task_e1_02', 'event_r1_05', 'Send invitations', 'Email invites to all attendees', NOW() - INTERVAL '10 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),
  (:'TENANT_ID', 'task_e1_03', 'event_r1_05', 'Arrange catering', 'Order lunch and refreshments', NOW() - INTERVAL '3 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  (:'TENANT_ID', 'task_e1_04', 'event_r1_05', 'Setup AV equipment', 'Projector and sound system', NOW() + INTERVAL '1 day', 'HIGH', 'IN_PROGRESS', 'PRE_EVENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  (:'TENANT_ID', 'task_e1_05', 'event_r1_05', 'Prepare presentation materials', 'Print handouts and slides', NOW() - INTERVAL '2 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  (:'TENANT_ID', 'task_e1_06', 'event_r1_05', 'Confirm attendee count', 'Get final RSVP numbers', NOW() - INTERVAL '1 day', 'HIGH', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days'),
  (:'TENANT_ID', 'task_e1_07', 'event_r1_05', 'Arrange parking passes', 'Coordinate with building management', NOW() + INTERVAL '2 days', 'LOW', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  (:'TENANT_ID', 'task_e1_08', 'event_r1_05', 'Setup registration desk', 'Prepare check-in materials', NOW() + INTERVAL '14 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (:'TENANT_ID', 'task_e1_09', 'event_r1_05', 'Welcome attendees', 'Greet guests at entrance', NOW() + INTERVAL '15 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (:'TENANT_ID', 'task_e1_10', 'event_r1_05', 'Monitor event flow', 'Ensure schedule adherence', NOW() + INTERVAL '15 days', 'HIGH', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (:'TENANT_ID', 'task_e1_11', 'event_r1_05', 'Collect feedback forms', 'Distribute and collect surveys', NOW() + INTERVAL '15 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  (:'TENANT_ID', 'task_e1_12', 'event_r1_05', 'Send thank you emails', 'Follow up with attendees', NOW() + INTERVAL '18 days', 'LOW', 'TO_DO', 'POST_EVENT', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Event: Global Ventures Q1 Kickoff (event_r2_04) - UPCOMING
-- Total: 10 tasks, 6 open (60%), 2 overdue, 3 idle
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_e2_01', 'event_r2_04', 'Book venue', 'Reserve Harbor Convention Center', NOW() - INTERVAL '15 days', 'URGENT', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),
  (:'TENANT_ID', 'task_e2_02', 'event_r2_04', 'Design event branding', 'Create logos and banners', NOW() - INTERVAL '8 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '25 days', NOW() - INTERVAL '8 days'),
  (:'TENANT_ID', 'task_e2_03', 'event_r2_04', 'Order promotional materials', 'T-shirts, bags, stationery', NOW() - INTERVAL '4 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (:'TENANT_ID', 'task_e2_04', 'event_r2_04', 'Hire photographer', 'Book professional photographer', NOW() - INTERVAL '2 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  (:'TENANT_ID', 'task_e2_05', 'event_r2_04', 'Setup stage and lighting', 'Coordinate with AV team', NOW() + INTERVAL '1 day', 'HIGH', 'IN_PROGRESS', 'PRE_EVENT', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),
  (:'TENANT_ID', 'task_e2_06', 'event_r2_04', 'Arrange accommodation', 'Hotel rooms for out-of-town guests', NOW() + INTERVAL '3 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '15 days', NOW() - INTERVAL '9 days'),
  (:'TENANT_ID', 'task_e2_07', 'event_r2_04', 'Create event schedule', 'Finalize agenda and timings', NOW() + INTERVAL '2 days', 'HIGH', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '14 days', NOW() - INTERVAL '11 days'),
  (:'TENANT_ID', 'task_e2_08', 'event_r2_04', 'Coordinate catering menu', 'Select breakfast and lunch options', NOW() + INTERVAL '4 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (:'TENANT_ID', 'task_e2_09', 'event_r2_04', 'Setup event app', 'Configure mobile event platform', NOW() + INTERVAL '5 days', 'LOW', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  (:'TENANT_ID', 'task_e2_10', 'event_r2_04', 'Brief event staff', 'Training session for volunteers', NOW() + INTERVAL '7 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Event: Bright Future Alumni Reunion (event_r3_03) - UPCOMING
-- Total: 8 tasks, 7 open (87.5%), 4 overdue, 1 idle
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_e3_01', 'event_r3_03', 'Contact alumni database', 'Get updated contact list', NOW() - INTERVAL '20 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '35 days', NOW() - INTERVAL '20 days'),
  (:'TENANT_ID', 'task_e3_02', 'event_r3_03', 'Send save-the-date', 'Email and mail announcements', NOW() - INTERVAL '12 days', 'HIGH', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (:'TENANT_ID', 'task_e3_03', 'event_r3_03', 'Book entertainment', 'Hire band or DJ', NOW() - INTERVAL '8 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  (:'TENANT_ID', 'task_e3_04', 'event_r3_03', 'Arrange campus tour', 'Coordinate with administration', NOW() - INTERVAL '5 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  (:'TENANT_ID', 'task_e3_05', 'event_r3_03', 'Create photo slideshow', 'Compile historical photos', NOW() - INTERVAL '3 days', 'LOW', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  (:'TENANT_ID', 'task_e3_06', 'event_r3_03', 'Setup registration booth', 'Prepare name tags and materials', NOW() + INTERVAL '18 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '15 days', NOW() - INTERVAL '9 days'),
  (:'TENANT_ID', 'task_e3_07', 'event_r3_03', 'Arrange food stations', 'Setup buffet and refreshments', NOW() + INTERVAL '19 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (:'TENANT_ID', 'task_e3_08', 'event_r3_03', 'Coordinate group photo', 'Schedule photographer for group shot', NOW() + INTERVAL '20 days', 'LOW', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- Event: Acme Product Training Workshop (event_ongoing_01) - ONGOING (2-day event)
-- Total: 6 tasks, 3 in-progress/to-do for ON_EVENT
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_ongoing1_01', 'event_ongoing_01', 'Prepare training materials', 'Print handouts and workbooks', NOW() - INTERVAL '5 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
  (:'TENANT_ID', 'task_ongoing1_02', 'event_ongoing_01', 'Setup training room', 'Arrange tables and equipment', NOW() - INTERVAL '1 day', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  (:'TENANT_ID', 'task_ongoing1_03', 'event_ongoing_01', 'Test equipment', 'Verify all AV working', NOW() - INTERVAL '1 day', 'MEDIUM', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
  (:'TENANT_ID', 'task_ongoing1_04', 'event_ongoing_01', 'Welcome participants', 'Registration and orientation', NOW(), 'HIGH', 'IN_PROGRESS', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW()),
  (:'TENANT_ID', 'task_ongoing1_05', 'event_ongoing_01', 'Monitor lunch catering', 'Ensure meals arrive on time', NOW(), 'MEDIUM', 'IN_PROGRESS', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW()),
  (:'TENANT_ID', 'task_ongoing1_06', 'event_ongoing_01', 'Collect feedback surveys', 'Distribute end-of-day surveys', NOW() + INTERVAL '1 day', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW());

-- Event: Global Ventures Innovation Summit (event_ongoing_02) - ONGOING (5-day event)
-- Total: 8 tasks, 5 in-progress/to-do for ON_EVENT
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_ongoing2_01', 'event_ongoing_02', 'Setup main stage', 'Install lighting and sound', NOW() - INTERVAL '3 days', 'URGENT', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
  (:'TENANT_ID', 'task_ongoing2_02', 'event_ongoing_02', 'Brief keynote speakers', 'Review schedule and logistics', NOW() - INTERVAL '2 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
  (:'TENANT_ID', 'task_ongoing2_03', 'event_ongoing_02', 'Setup exhibition booths', 'Arrange vendor displays', NOW() - INTERVAL '1 day', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
  (:'TENANT_ID', 'task_ongoing2_04', 'event_ongoing_02', 'Manage daily registration', 'Check-in attendees each day', NOW(), 'HIGH', 'IN_PROGRESS', 'ON_EVENT', NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'task_ongoing2_05', 'event_ongoing_02', 'Coordinate breakout sessions', 'Manage parallel tracks', NOW(), 'HIGH', 'IN_PROGRESS', 'ON_EVENT', NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'task_ongoing2_06', 'event_ongoing_02', 'Monitor networking areas', 'Ensure catering and seating', NOW(), 'MEDIUM', 'IN_PROGRESS', 'ON_EVENT', NOW() - INTERVAL '8 days', NOW()),
  (:'TENANT_ID', 'task_ongoing2_07', 'event_ongoing_02', 'Technical support standby', 'Fix AV issues as they arise', NOW() + INTERVAL '2 days', 'HIGH', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '8 days', NOW()),
  (:'TENANT_ID', 'task_ongoing2_08', 'event_ongoing_02', 'Closing ceremony setup', 'Prepare awards and finale', NOW() + INTERVAL '3 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW());

-- Event: Bright Future Parent-Teacher Conference (event_week_01) - THIS WEEK (starts in 2 days)
-- Total: 5 tasks, 4 open
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_week1_01', 'event_week_01', 'Send conference reminders', 'Email all parents', NOW() - INTERVAL '3 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days'),
  (:'TENANT_ID', 'task_week1_02', 'event_week_01', 'Prepare classroom schedules', 'Print appointment sheets', NOW(), 'HIGH', 'IN_PROGRESS', 'PRE_EVENT', NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'task_week1_03', 'event_week_01', 'Setup refreshment station', 'Coffee and snacks for parents', NOW() + INTERVAL '1 day', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '8 days', NOW()),
  (:'TENANT_ID', 'task_week1_04', 'event_week_01', 'Guide parents to classrooms', 'Wayfinding and assistance', NOW() + INTERVAL '2 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '7 days', NOW()),
  (:'TENANT_ID', 'task_week1_05', 'event_week_01', 'Collect feedback cards', 'Gather parent input', NOW() + INTERVAL '3 days', 'LOW', 'TO_DO', 'POST_EVENT', NOW() - INTERVAL '7 days', NOW());

-- Event: Premier Bank Branch Manager Training (event_week_02) - THIS WEEK (starts in 5 days)
-- Total: 6 tasks, 5 open
INSERT INTO tasks ("tenantId", id, "eventId", title, description, "dueDate", priority, status, type, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'task_week2_01', 'event_week_02', 'Book hotel accommodations', 'Reserve rooms for managers', NOW() - INTERVAL '5 days', 'HIGH', 'COMPLETED', 'PRE_EVENT', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),
  (:'TENANT_ID', 'task_week2_02', 'event_week_02', 'Prepare training curriculum', 'Finalize presentation slides', NOW() + INTERVAL '1 day', 'HIGH', 'IN_PROGRESS', 'PRE_EVENT', NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'task_week2_03', 'event_week_02', 'Order training materials', 'Binders, pens, notebooks', NOW() + INTERVAL '2 days', 'MEDIUM', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '8 days', NOW()),
  (:'TENANT_ID', 'task_week2_04', 'event_week_02', 'Setup training room', 'Arrange seating and equipment', NOW() + INTERVAL '4 days', 'HIGH', 'TO_DO', 'PRE_EVENT', NOW() - INTERVAL '6 days', NOW()),
  (:'TENANT_ID', 'task_week2_05', 'event_week_02', 'Welcome and registration', 'Check-in managers', NOW() + INTERVAL '5 days', 'MEDIUM', 'TO_DO', 'ON_EVENT', NOW() - INTERVAL '5 days', NOW()),
  (:'TENANT_ID', 'task_week2_06', 'event_week_02', 'Distribute certificates', 'Award completion certificates', NOW() + INTERVAL '6 days', 'LOW', 'TO_DO', 'POST_EVENT', NOW() - INTERVAL '5 days', NOW());

-- ============================================================================
-- ESTIMATES (for Budget Utilization calculation)
-- ============================================================================
INSERT INTO estimates ("tenantId", id, "clientId", "eventId", title, status, "eventName", "eventVenue", "eventStartDate", "eventEndDate", "lineItems", discount, "createdAt", "updatedAt") VALUES
  -- Acme Q1 2026 Strategy Meeting (increased estimate for realistic utilization)
  (:'TENANT_ID', 'est_001', 'client_repeat_001', 'event_r1_05', 'Acme Q1 Strategy Meeting Estimate', 'ACCEPTED', 'Acme Q1 2026 Strategy Meeting', 'Skyline Hotel', NOW() + INTERVAL '15 days', NOW() + INTERVAL '17 days',
   '[{"category":"Venue Rental","description":"Conference room for 2 days","quantity":2,"unit":"day","rate":2000,"amount":4000},{"category":"Catering","description":"Lunch and refreshments","quantity":50,"unit":"person","rate":45,"amount":2250},{"category":"AV Equipment","description":"Projector and sound system","quantity":1,"unit":"set","rate":800,"amount":800},{"category":"Printing","description":"Materials and signage","quantity":1,"unit":"set","rate":500,"amount":500},{"category":"Staff","description":"Event coordination","quantity":16,"unit":"hour","rate":75,"amount":1200}]'::json,
   0, NOW() - INTERVAL '1 month', NOW()),
  
  -- Global Ventures Q1 Kickoff (increased estimate for realistic utilization)
  (:'TENANT_ID', 'est_002', 'client_repeat_002', 'event_r2_04', 'Global Ventures Kickoff Estimate', 'ACCEPTED', 'Global Ventures Q1 Kickoff', 'Harbor Convention Center', NOW() + INTERVAL '8 days', NOW() + INTERVAL '9 days',
   '[{"category":"Venue Rental","description":"Main hall rental","quantity":1,"unit":"day","rate":5000,"amount":5000},{"category":"Catering","description":"Full day catering","quantity":100,"unit":"person","rate":60,"amount":6000},{"category":"Audio/Visual","description":"Stage, lighting, sound","quantity":1,"unit":"set","rate":3000,"amount":3000},{"category":"Decorations","description":"Branding and decor","quantity":1,"unit":"set","rate":1500,"amount":1500},{"category":"Transportation","description":"Guest shuttle service","quantity":1,"unit":"event","rate":1200,"amount":1200},{"category":"Printing","description":"Programs and signage","quantity":1,"unit":"set","rate":800,"amount":800},{"category":"Photography","description":"Event photographer","quantity":8,"unit":"hour","rate":150,"amount":1200}]'::json,
   3.23, NOW() - INTERVAL '2 weeks', NOW()),
  
  -- Bright Future Alumni Reunion (increased estimate for realistic utilization)
  (:'TENANT_ID', 'est_003', 'client_repeat_003', 'event_r3_03', 'Alumni Reunion Estimate', 'SENT', 'Bright Future Alumni Reunion', 'Campus Grounds', NOW() + INTERVAL '20 days', NOW() + INTERVAL '21 days',
   '[{"category":"Catering","description":"Buffet dinner","quantity":150,"unit":"person","rate":35,"amount":5250},{"category":"Entertainment","description":"Live band","quantity":1,"unit":"event","rate":2000,"amount":2000},{"category":"Photography","description":"Event photographer","quantity":4,"unit":"hour","rate":150,"amount":600},{"category":"Decorations","description":"Venue decorations","quantity":1,"unit":"set","rate":1200,"amount":1200},{"category":"AV Equipment","description":"Sound system rental","quantity":1,"unit":"set","rate":600,"amount":600}]'::json,
   0, NOW() - INTERVAL '1 month', NOW());

-- ============================================================================
-- BILLS (for Finance Overview - varying due dates and vendors)
-- ============================================================================

-- Current Month Bills (January 2026)
INSERT INTO bills ("tenantId", id, "eventId", number, "vendorId", "serviceCategoryId", "billDate", "dueDate", amount, "createdAt", "updatedAt") VALUES
  -- Overdue from last month
  (:'TENANT_ID', 'bill_001', 'event_r1_04', 'INV-CAT-2025-12-001', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days', 3500.00, NOW() - INTERVAL '25 days', NOW()),
  (:'TENANT_ID', 'bill_002', 'event_r2_03', 'INV-VEN-2025-12-002', 'vendor_002', 'cat_venue_002', NOW() - INTERVAL '28 days', NOW() - INTERVAL '8 days', 4200.00, NOW() - INTERVAL '28 days', NOW()),
  (:'TENANT_ID', 'bill_003', 'event_r3_02', 'INV-DEC-2025-12-003', 'vendor_004', 'cat_decor_004', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 days', 1800.00, NOW() - INTERVAL '30 days', NOW()),
  
  -- Due this week
  (:'TENANT_ID', 'bill_004', 'event_r4_02', 'INV-CAT-2026-01-001', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '15 days', NOW() + INTERVAL '2 days', 2800.00, NOW() - INTERVAL '15 days', NOW()),
  (:'TENANT_ID', 'bill_005', 'event_r5_01', 'INV-AV-2026-01-002', 'vendor_003', 'cat_av_003', NOW() - INTERVAL '12 days', NOW() + INTERVAL '3 days', 1500.00, NOW() - INTERVAL '12 days', NOW()),
  (:'TENANT_ID', 'bill_006', 'event_ot_05', 'INV-PHO-2026-01-003', 'vendor_005', 'cat_photo_005', NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days', 1200.00, NOW() - INTERVAL '10 days', NOW()),
  
  -- Due later this month
  (:'TENANT_ID', 'bill_007', 'event_r1_05', 'INV-VEN-2026-01-004', 'vendor_002', 'cat_venue_002', NOW() - INTERVAL '8 days', NOW() + INTERVAL '15 days', 5000.00, NOW() - INTERVAL '8 days', NOW()),
  (:'TENANT_ID', 'bill_008', 'event_r2_04', 'INV-CAT-2026-01-005', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '7 days', NOW() + INTERVAL '18 days', 6500.00, NOW() - INTERVAL '7 days', NOW()),
  (:'TENANT_ID', 'bill_009', 'event_r3_03', 'INV-MUS-2026-01-006', 'vendor_006', 'cat_music_006', NOW() - INTERVAL '5 days', NOW() + INTERVAL '20 days', 2200.00, NOW() - INTERVAL '5 days', NOW()),
  (:'TENANT_ID', 'bill_010', 'event_r1_05', 'INV-AV-2026-01-007', 'vendor_003', 'cat_av_003', NOW() - INTERVAL '3 days', NOW() + INTERVAL '22 days', 3200.00, NOW() - INTERVAL '3 days', NOW()),
  
  -- Additional bills to demonstrate category distribution
  (:'TENANT_ID', 'bill_011', 'event_r4_03', 'INV-TRA-2026-01-008', 'vendor_007', 'cat_transport_007', NOW() - INTERVAL '6 days', NOW() + INTERVAL '19 days', 1600.00, NOW() - INTERVAL '6 days', NOW()),
  (:'TENANT_ID', 'bill_012', 'event_r2_04', 'INV-PRI-2026-01-009', 'vendor_008', 'cat_printing_008', NOW() - INTERVAL '4 days', NOW() + INTERVAL '21 days', 950.00, NOW() - INTERVAL '4 days', NOW()),
  (:'TENANT_ID', 'bill_013', 'event_r5_02', 'INV-DEC-2026-01-010', 'vendor_004', 'cat_decor_004', NOW() - INTERVAL '2 days', NOW() + INTERVAL '23 days', 2400.00, NOW() - INTERVAL '2 days', NOW()),
  
  -- Bills for event_r1_05 to match estimate est_001 (total estimate: 7050)
  (:'TENANT_ID', 'bill_017', 'event_r1_05', 'INV-CAT-2026-01-011', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '7 days', NOW() + INTERVAL '16 days', 2250.00, NOW() - INTERVAL '7 days', NOW()),
  
  -- Bills for event_r2_04 to match estimate est_002 (total estimate: 14500)
  (:'TENANT_ID', 'bill_018', 'event_r2_04', 'INV-AV-2026-01-012', 'vendor_003', 'cat_av_003', NOW() - INTERVAL '9 days', NOW() + INTERVAL '17 days', 3000.00, NOW() - INTERVAL '9 days', NOW()),
  (:'TENANT_ID', 'bill_019', 'event_r2_04', 'INV-DEC-2026-01-013', 'vendor_004', 'cat_decor_004', NOW() - INTERVAL '6 days', NOW() + INTERVAL '17 days', 1500.00, NOW() - INTERVAL '6 days', NOW()),
  
  -- Bills for event_r3_03 to match estimate est_003 (total estimate: 7850)
  (:'TENANT_ID', 'bill_020', 'event_r3_03', 'INV-CAT-2026-01-014', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '10 days', NOW() + INTERVAL '19 days', 5250.00, NOW() - INTERVAL '10 days', NOW()),
  (:'TENANT_ID', 'bill_021', 'event_r3_03', 'INV-MUS-2026-01-015', 'vendor_006', 'cat_music_006', NOW() - INTERVAL '8 days', NOW() + INTERVAL '19 days', 2000.00, NOW() - INTERVAL '8 days', NOW());

-- Last Month Bills (December 2025) - for payment history
INSERT INTO bills ("tenantId", id, "eventId", number, "vendorId", "serviceCategoryId", "billDate", "dueDate", amount, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'bill_014', 'event_r1_04', 'INV-VEN-2025-11-001', 'vendor_002', 'cat_venue_002', NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days', 3800.00, NOW() - INTERVAL '45 days', NOW()),
  (:'TENANT_ID', 'bill_015', 'event_r1_04', 'INV-PHO-2025-11-002', 'vendor_005', 'cat_photo_005', NOW() - INTERVAL '42 days', NOW() - INTERVAL '28 days', 1400.00, NOW() - INTERVAL '42 days', NOW()),
  (:'TENANT_ID', 'bill_016', 'event_r2_03', 'INV-CAT-2025-11-003', 'vendor_001', 'cat_catering_001', NOW() - INTERVAL '40 days', NOW() - INTERVAL '25 days', 4500.00, NOW() - INTERVAL '40 days', NOW());

-- ============================================================================
-- PAYMENT RECORDS (partial payments to show pending amounts)
-- ============================================================================

-- First, create payment modes
INSERT INTO payment_modes ("tenantId", id, name, "createdAt", "updatedAt") VALUES
  (:'TENANT_ID', 'pm_001', 'Bank Transfer', NOW(), NOW()),
  (:'TENANT_ID', 'pm_002', 'Credit Card', NOW(), NOW()),
  (:'TENANT_ID', 'pm_003', 'Check', NOW(), NOW()),
  (:'TENANT_ID', 'pm_004', 'Cash', NOW(), NOW());

-- Partial payments on some bills
INSERT INTO payment_records ("tenantId", id, "billId", "paymentDate", amount, "paymentModeId", "referenceNumber", "createdAt", "updatedAt") VALUES
  -- Bill 001: Paid 50% (1750 paid, 1750 pending)
  (:'TENANT_ID', 'pay_001', 'bill_001', NOW() - INTERVAL '3 days', 1750.00, 'pm_001', 'TXN-2026-001', NOW() - INTERVAL '3 days', NOW()),
  
  -- Bill 002: Paid 30% (1260 paid, 2940 pending)
  (:'TENANT_ID', 'pay_002', 'bill_002', NOW() - INTERVAL '5 days', 1260.00, 'pm_002', 'TXN-2026-002', NOW() - INTERVAL '5 days', NOW()),
  
  -- Bill 003: Fully unpaid (1800 pending)
  
  -- Bill 004: Paid 25% (700 paid, 2100 pending)
  (:'TENANT_ID', 'pay_003', 'bill_004', NOW() - INTERVAL '2 days', 700.00, 'pm_001', 'TXN-2026-003', NOW() - INTERVAL '2 days', NOW()),
  
  -- Bill 005: Fully unpaid (1500 pending)
  
  -- Bill 006: Paid 50% (600 paid, 600 pending)
  (:'TENANT_ID', 'pay_004', 'bill_006', NOW() - INTERVAL '1 day', 600.00, 'pm_003', 'CHK-2026-001', NOW() - INTERVAL '1 day', NOW()),
  
  -- Bills 007-013: All unpaid for demo purposes
  
  -- Last month bills: Fully paid
  (:'TENANT_ID', 'pay_005', 'bill_014', NOW() - INTERVAL '28 days', 3800.00, 'pm_001', 'TXN-2025-101', NOW() - INTERVAL '28 days', NOW()),
  (:'TENANT_ID', 'pay_006', 'bill_015', NOW() - INTERVAL '26 days', 1400.00, 'pm_002', 'TXN-2025-102', NOW() - INTERVAL '26 days', NOW()),
  (:'TENANT_ID', 'pay_007', 'bill_016', NOW() - INTERVAL '24 days', 4500.00, 'pm_001', 'TXN-2025-103', NOW() - INTERVAL '24 days', NOW());

-- ============================================================================
-- Summary of Demo Data
-- ============================================================================
-- LEADS: 32 leads in current quarter (smooth funnel progression)
--   - NEW: 8 (100%)
--   - CONTACTED: 7 (~88% progression)
--   - PROPOSAL_SENT: 6 (~86% progression)
--   - FOLLOW_UP: 5 (~83% progression)
--   - CONVERTED: 4 (~80% progression from follow-up, ~13% overall conversion)
--   - LOST: 2 (realistic attrition)
--
-- CLIENTS: 15 clients (5 repeat + 6 one-time + 4 new from converted leads)
--   - Repeat Client Rate: ~33% (5/15)
--
-- EVENTS: 27 events total
--   - Past events with ratings (for CSAT)
--   - Ongoing events: 2 (currently happening)
--   - Events this week: 2 (starting within 7 days)
--   - Upcoming events (for task demonstration)
--
-- TASKS: 55 tasks across 7 events (3 upcoming + 2 ongoing + 2 this week)
--   - Event 1: 12 tasks (5 open, 3 overdue, 2 idle)
--   - Event 2: 10 tasks (6 open, 2 overdue, 3 idle)
--   - Event 3: 8 tasks (7 open, 4 overdue, 1 idle)
--   - Ongoing Event 1: 6 tasks (3 in-progress for ON_EVENT)
--   - Ongoing Event 2: 8 tasks (5 in-progress/to-do for ON_EVENT)
--   - This Week Event 1: 5 tasks (4 open)
--   - This Week Event 2: 6 tasks (5 open)
--
-- BILLS: 24 bills
--   - Current month: 21 bills (including bills matching estimate amounts)
--   - Overdue: 3 bills (~$9,500 pending)
--   - Due this week: 3 bills (~$4,400 pending)
--   - Due later: 15 bills (~$36,900 pending)
--   - Bills for events with estimates: 9 bills matching estimate line items
--
-- VENDORS: 8 vendors with varying pending amounts
--   - Elite Catering: ~$10,400 pending
--   - Grand Ballroom: ~$7,140 pending
--   - ProSound AV: ~$4,700 pending
--   - Others: varying amounts
-- ============================================================================

COMMIT;

-- Display summary (combined into single query for better output)
SELECT 
  '==== DEMO DATA SEEDING COMPLETED ====' as status,
  (SELECT COUNT(*) FROM leads WHERE "tenantId" = :'TENANT_ID') as total_leads,
  (SELECT COUNT(*) FROM clients WHERE "tenantId" = :'TENANT_ID') as total_clients,
  (SELECT COUNT(*) FROM events WHERE "tenantId" = :'TENANT_ID') as total_events,
  (SELECT COUNT(*) FROM events WHERE "tenantId" = :'TENANT_ID' AND "startDate" <= NOW() AND "endDate" >= NOW()) as ongoing_events,
  (SELECT COUNT(*) FROM events WHERE "tenantId" = :'TENANT_ID' AND "startDate" >= NOW() AND "startDate" <= NOW() + INTERVAL '7 days') as events_this_week,
  (SELECT COUNT(*) FROM tasks WHERE "tenantId" = :'TENANT_ID') as total_tasks,
  (SELECT COUNT(*) FROM bills WHERE "tenantId" = :'TENANT_ID') as total_bills,
  (SELECT COUNT(*) FROM vendors WHERE "tenantId" = :'TENANT_ID') as total_vendors;
