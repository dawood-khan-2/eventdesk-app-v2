# Demo Data Feature

This feature automatically populates new organizations with contextual demo data during onboarding to help users explore the platform and improve adoption rates.

## Overview

When enabled (default), users are prompted during onboarding to select their event type (Marriage, Concerts, Conferences, or Others). Based on their selection, the system seeds meaningful, intuitive demo data tailored to that event category.

## Files Changed/Created

### New Files
- **`apps/app/lib/seed-demo-data.ts`** - Core seeding utility with event-type-specific templates

### Modified Files
- **`apps/app/app/(unauthenticated)/organization-setup/page.tsx`** - Added event type selection UI and seeding logic with retry mechanism

## How to Enable

### 1. Environment Variable Configuration

The feature is controlled by the `NEXT_PUBLIC_ENABLE_DEMO_DATA` environment variable.

**Enabled by default:**
The feature is active unless explicitly disabled. No configuration needed.

**To disable:**
```env
# .env.local or environment settings
NEXT_PUBLIC_ENABLE_DEMO_DATA=false
```

**To enable (explicit):**
```env
# .env.local or environment settings
NEXT_PUBLIC_ENABLE_DEMO_DATA=true
```

### 2. Verify Configuration

Once enabled, new users will see the event type selection during onboarding:

1. User enters organization name
2. User selects event type:
   - **Marriage** - Weddings, receptions, ceremonies
   - **Concerts** - Music festivals, live performances, shows
   - **Conferences** - Business events, summits, seminars
   - **Others** - Corporate events, galas, celebrations
3. System creates organization and seeds demo data
4. User is redirected to dashboard with populated data

## Demo Data Included

For each event type, the system creates:

### Core Data (1 record each)
- **Lead** - Sample potential client inquiry
- **Client** - Confirmed booking client
- **Event** - Upcoming event scheduled 30 days out

### Event Details
- **Tasks (5)** - Mix of PRE_EVENT, ON_EVENT, POST_EVENT tasks
  - Various priorities (LOW, MEDIUM, HIGH, URGENT)
  - Various statuses (TO_DO, IN_PROGRESS)
- **Itinerary Items (4-5)** - Event schedule/timeline
- **Guests (2)** - Sample attendee registrations
- **Estimate (1)** - Financial estimate with 3 line items

### Event Type Examples

#### Marriage
- Client: "Sarah & Michael's Wedding"
- Venue: Lakeside Gardens Resort
- Services: Catering (150 guests), Photography, Floral Arrangements
- Tasks: Finalize guest list, cake tasting, photographer coordination

#### Concerts
- Client: "Luna Events Corporation"
- Event: "Indie Vibes Music Festival"
- Venue: Central Park Amphitheater (5000 capacity)
- Services: Stage & Sound, Artist Fees (12 bands), Security
- Tasks: Confirm artist lineup, sound setup, security briefing

#### Conferences
- Client: "Innovation Hub Inc."
- Event: "Future of Tech Summit 2026"
- Venue: Grand Convention Center (500 attendees)
- Services: Venue Rental, Catering, AV Equipment
- Tasks: Finalize speaker schedule, AV testing, print badges

#### Others
- Client: "Global Enterprises Ltd."
- Event: "Annual Company Gala & Awards"
- Venue: Riverside Hotel Grand Ballroom (300 guests)
- Services: Venue, Catering with open bar, Live entertainment
- Tasks: Design awards program, book entertainment, table arrangements

## User Experience

### With Feature Enabled (Default)

1. **Onboarding Flow:**
   ```
   Enter Org Name → Select Event Type → Creating... → Loading demo data... → Dashboard
   ```

2. **Progress Indicators:**
   - "Creating organization..." (during org creation)
   - "Loading demo data (attempt X)..." (during seeding with retry count)
   - "Redirecting..." (before navigation)

3. **Loading State:**
   - Spinner icon displayed
   - Button disabled
   - Progress text updates in real-time

4. **Retry Mechanism:**
   - If demo data fails to load (webhook delay), automatic retry up to 10 times
   - After org creation, button changes to "Retry Loading Demo Data"
   - "Skip and Continue" button appears to bypass demo data loading

### With Feature Disabled

Standard onboarding flow without event type selection:
```
Enter Org Name → Creating... → Dashboard (empty state)
```

## Technical Details

### Multi-Tenant Isolation

All demo data is properly scoped using the multi-tenant pattern:

```typescript
multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
  // All queries automatically scoped to tenant
  await prisma.lead.create({ data: { tenantId, ... } });
});
```

This ensures:
- Row-level security (RLS) is enforced
- Demo data is isolated per organization
- No data leakage between tenants

### Data Relationships

The seeding function maintains proper foreign key relationships:

```
Organization
  ├── Lead (status: CONTACTED)
  ├── Client (converted from different lead concept)
  └── Event
      ├── Tasks (5 tasks with varied statuses)
      ├── Itinerary (4-5 scheduled items)
      ├── Guests (2 registrations)
      └── Estimate (linked to client, event, and original lead)
```

### Event Timing

- **Event Start Date:** 30 days from onboarding date at 2:00 PM
- **Event End Date:** Same day at 10:00 PM
- **Registration Deadline:** 7 days before event
- **Task Due Dates:** Spread across pre-event period (every 3 days)
- **Itinerary Times:** Offset from event start (e.g., -1 hour for guest arrival)

## Testing

### Manual Testing

1. **Enable feature flag** for your test user
2. **Clear existing org memberships** (or use new account)
3. **Navigate to organization setup:** `/organization-setup`
4. **Enter org name** and select event type
5. **Click "Create organization"**
6. **Verify:**
   - Progress indicators appear
   - Loading takes 2-5 seconds
   - Redirected to dashboard with populated data
7. **Check each section:**
   - Leads page shows 1 lead
   - Clients page shows 1 client
   - Events page shows 1 event
   - Event detail page shows tasks, itinerary, guests, estimate

### Automated Testing

```typescript
// Example test in apps/app/__tests__/seed-demo-data.test.ts
import { seedDemoData } from "@/lib/seed-demo-data";

describe("seedDemoData", () => {
  it("creates demo data for MARRIAGE event type", async () => {
    const result = await seedDemoData("MARRIAGE");
    
    expect(result.success).toBe(true);
    expect(result.counts).toEqual({
      leads: 1,
      clients: 1,
      events: 1,
      tasks: 5,
      itineraries: 5,
      guests: 2,
      estimates: 1,
    });
  });
});
```

## Monitoring

### Success Metrics
- **Activation Rate:** % of users who interact with demo data within first session
- **Feature Adoption:** % of users who create their own data after exploring demos
- **Time to First Action:** Average time from onboarding to first real data creation
- **Demo Engagement:** % of users who view multiple demo records

### Potential Issues

1. **Slow Seeding:** If seeding takes >10 seconds, check database connection pooling
2. **Missing Data:** Verify all Prisma relationships and required fields
3. **Webhook Delay:** Organization creation webhook may take 500ms-5s to complete
   - Retry mechanism handles this automatically (up to 10 attempts)
   - Users can manually retry or skip if needed
4. **Environment Variable Not Working:** Ensure `NEXT_PUBLIC_` prefix is used and app is rebuilt

## Future Enhancements

### Phase 2 (Not Implemented Yet)
- Invoice generation for completed events
- Bill records with vendor relationships
- Service categories (Catering, Venue, etc.)
- Vendors with service mappings
- Payment modes and payment records

### Phase 3 (Ideas)
- Multiple events per type
- Event photos/attachments
- Guest meal preferences
- Email templates
- Collaboration comments

## Rollback

To disable the feature:

1. **Set environment variable** `NEXT_PUBLIC_ENABLE_DEMO_DATA=false`
2. **Redeploy application** (or restart dev server)
3. **Existing orgs** with demo data are unaffected
4. **New sign-ups** will get empty state
5. **No code changes needed** - purely environment-controlled

## Support

For issues or questions:
- Check `NEXT_PUBLIC_ENABLE_DEMO_DATA` environment variable
- Review server logs for seeding errors ("Organization not found" = webhook delay)
- Verify database schema matches expectations
- Test with environment variable enabled/disabled states
- Check Clerk webhook logs if organization creation fails
