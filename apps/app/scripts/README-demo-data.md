# Dashboard Demo Data Scripts

This directory contains SQL scripts to populate your EventDesk database with comprehensive demo data that showcases all dashboard features.

## Prerequisites

1. You need your **organization/tenant ID** from the database
2. Access to your PostgreSQL database (via psql, pgAdmin, or similar)
3. Active EventDesk application with at least one organization created

## Finding Your Tenant ID

Run this query to find your organization ID:

```sql
SELECT id, name, clerk_id FROM organizations;
```

Copy the `id` value (e.g., `clxxxxxxxxxxxx`) - this is your TENANT_ID.

## Running the Seed Script

### Option 1: Using psql (Command Line)

```bash
# Connect to your database
psql "your-database-connection-string"

# Set the TENANT_ID variable and run the seed script
\set TENANT_ID 'your-actual-org-id-here'
\i apps/app/scripts/seed-dashboard-demo.sql
```

### Option 2: Using SQL Editor (pgAdmin, TablePlus, etc.)

1. Open `seed-dashboard-demo.sql` in your SQL editor
2. Replace `:'TENANT_ID'` with your actual tenant ID (use Find & Replace)
   - Find: `:'TENANT_ID'`
   - Replace: `'clxxxxxxxxxxxx'` (your actual ID in quotes)
3. Execute the entire script

### Option 3: Using Environment Variable

```bash
# Set environment variable
export TENANT_ID='your-actual-org-id-here'

# Run with psql
psql "your-database-connection-string" -v TENANT_ID="'$TENANT_ID'" -f apps/app/scripts/seed-dashboard-demo.sql
```

## What Gets Created

The seed script creates comprehensive demo data for a **full-featured dashboard**:

### Task Overview Section
- **3 upcoming events** with varying task loads
- **30 total tasks** distributed across events:
  - Mix of completed, in-progress, to-do, and cancelled statuses
  - **Overdue tasks** (due date < today)
  - **Idle tasks** (not updated in 7+ days)
  - Various priority levels (Low, Medium, High, Urgent)

### Finance Overview Section
- **8 service categories** (Catering, Venue, AV, Decor, Photography, Entertainment, Transport, Printing)
- **8 vendors** with realistic company details
- **16 bills** for current and last month:
  - **3 overdue bills** (~$9,500 pending)
  - **3 bills due this week** (~$4,400 pending)
  - **7 bills due later** (~$23,850 pending)
- **Partial payments** on some bills to show pending amounts
- **4 payment modes** (Bank Transfer, Credit Card, Check, Cash)

### Client Engagement & Lead Insights
- **18 leads** in various funnel stages (current quarter):
  - 5 NEW
  - 4 CONTACTED
  - 3 PROPOSAL_SENT
  - 2 FOLLOW_UP
  - 2 CONVERTED
  - 2 LOST
  - **Conversion rate: ~11%**
- **13 clients**:
  - **5 repeat clients** with 2-5 events each
  - **6 one-time clients** (single events)
  - **2 recently converted** from leads
  - **Repeat client rate: ~38%**
- **23 events** spanning the past year + upcoming:
  - Past events with **ratings** (1-5 stars) for CSAT calculation
  - Upcoming events for task demonstration
  - Various venues and event types

### Top Metrics
- **Events this week**: Calculated based on current date
- **Open tasks**: ~18 open tasks across upcoming events
- **Budget utilization**: 3 estimates (1 ACCEPTED, 2 SENT) linked to events
- **Bills due**: ~$38,000 in pending payments
- **CSAT Score**: Based on ~15 rated events (average 4.5/5 = 90%)
- **Lead conversion rate**: ~11% for current quarter

## Dashboard Features Demonstrated

✅ **Task Overview**
- Top 3 events with highest open task counts
- Top 3 events with highest overdue task percentages (color-coded progress bars)
- Top 3 events with most idle tasks (not updated in 7+ days)

✅ **Finance Overview**
- Top 5 cost categories by monthly spend with progress bars
- Pending payments by status (Overdue, Due this week, Due later)
- Top 5 vendors by pending payment amount

✅ **Client Engagement & Lead Insights**
- Lead funnel chart with 5 stages and drop-off visualization
- Conversion rate and average time to convert metrics
- Repeat client percentage and average events per client
- Top 5 repeat clients by event count

## Cleanup / Removal

To remove all demo data:

```bash
# Using psql
\set TENANT_ID 'your-actual-org-id-here'
\i apps/app/scripts/cleanup-dashboard-demo.sql
```

Or manually run `cleanup-dashboard-demo.sql` with your tenant ID replaced.

## Important Notes

⚠️ **Tenant Scoping**: All data is scoped to your specified tenant ID. It won't affect other organizations in your database.

⚠️ **Date Calculations**: The script uses relative dates (NOW() + INTERVAL) so the data stays relevant regardless of when you run it.

⚠️ **IDs**: All demo data uses predictable ID patterns (`lead_*`, `client_*`, `event_*`, etc.) to make cleanup easy.

⚠️ **Non-Destructive**: The seed script only INSERTS data - it doesn't modify or delete existing records.

## Customization

You can customize the demo data by editing `seed-dashboard-demo.sql`:

- Adjust event counts and dates
- Modify bill amounts and due dates
- Change lead distribution across funnel stages
- Add more vendors or service categories
- Adjust task statuses and due dates

## Troubleshooting

**Error: null value in column "tenant_id"**
- Make sure you've set the TENANT_ID variable correctly

**Error: foreign key constraint violation**
- Ensure your organization exists in the `organizations` table
- Verify the TENANT_ID matches an actual organization ID

**No data showing on dashboard**
- Verify the seed script completed successfully (check the summary output)
- Ensure you're logged into the correct organization in the app
- Check that dates are calculated correctly (upcoming events should be in the future)

## Support

If you encounter issues:
1. Check the PostgreSQL error logs
2. Verify your tenant ID is correct
3. Ensure all required tables exist (run migrations if needed)
4. Review the script comments for data relationships

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Compatibility**: EventDesk Dashboard v2.0+
