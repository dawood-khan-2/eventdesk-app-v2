"use server";

import { multiTenantDb } from "@repo/database";
import { getTenantContext } from "@/app/(authenticated)/lib/auth-helpers";

export type EventType = "MARRIAGE" | "CONCERTS" | "CONFERENCES" | "OTHERS";

interface DemoDataTemplate {
  lead: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    notes: string;
  };
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    notes: string;
  };
  event: {
    name: string;
    venue: string;
    description: string;
    maxGuests: number;
  };
  tasks: Array<{
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    type: "PRE_EVENT" | "ON_EVENT" | "POST_EVENT";
  }>;
  itineraries: Array<{
    title: string;
    offset: number; // hours offset from event start
  }>;
  guests: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  estimate: {
    title: string;
    lineItems: Array<{
      serviceCategory: string;
      description: string;
      quantity: number;
      unit: string;
      rate: number;
      tax: number;
    }>;
  };
}

const templates: Record<EventType, DemoDataTemplate> = {
  MARRIAGE: {
    lead: {
      name: "Emily & James Anderson",
      email: "emily.anderson@example.com",
      phone: "+1 (555) 123-4567",
      notes: "Looking for a summer wedding venue with outdoor ceremony space",
    },
    client: {
      name: "Sarah & Michael Roberts",
      email: "sarah.roberts@example.com",
      phone: "+1 (555) 234-5678",
      notes: "Confirmed booking - Dream wedding at lakeside venue",
    },
    event: {
      name: "Sarah & Michael's Wedding",
      venue: "Lakeside Gardens Resort",
      description: "Elegant outdoor wedding ceremony followed by dinner reception under the stars",
      maxGuests: 150,
    },
    tasks: [
      {
        title: "Finalize guest list",
        description: "Confirm final headcount with caterer",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Wedding cake tasting",
        description: "Schedule tasting session with bakery",
        priority: "MEDIUM",
        type: "PRE_EVENT",
      },
      {
        title: "Coordinate photographer arrival",
        description: "Ensure photographer arrives 2 hours before ceremony",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Set up ceremony space",
        description: "Arrange chairs, arch, and flower decorations",
        priority: "URGENT",
        type: "ON_EVENT",
      },
      {
        title: "Send thank you cards",
        description: "Mail personalized thank you notes to all guests",
        priority: "MEDIUM",
        type: "POST_EVENT",
      },
    ],
    itineraries: [
      {
        title: "Guest arrival & welcome drinks",
        offset: -1, // 1 hour before event start
      },
      {
        title: "Wedding ceremony",
        offset: 0,
      },
      {
        title: "Cocktail hour & photos",
        offset: 1,
      },
      {
        title: "Reception dinner",
        offset: 2.5,
      },
      {
        title: "First dance & cake cutting",
        offset: 4,
      },
    ],
    guests: [
      {
        name: "Jennifer Williams",
        email: "jennifer.w@example.com",
        phone: "+1 (555) 345-6789",
      },
      {
        name: "David Thompson",
        email: "david.thompson@example.com",
      },
    ],
    estimate: {
      title: "Wedding Services Estimate",
      lineItems: [
        {
          serviceCategory: "Catering",
          description: "3-course dinner for 150 guests",
          quantity: 150,
          unit: "person",
          rate: 85.0,
          tax: 10,
        },
        {
          serviceCategory: "Photography",
          description: "Full-day coverage with 2 photographers",
          quantity: 1,
          unit: "package",
          rate: 3500.0,
          tax: 10,
        },
        {
          serviceCategory: "Floral Arrangements",
          description: "Ceremony arch, centerpieces, and bouquets",
          quantity: 1,
          unit: "package",
          rate: 2800.0,
          tax: 10,
        },
      ],
    },
  },
  CONCERTS: {
    lead: {
      name: "Marcus Johnson",
      email: "marcus.j@rockfest.com",
      phone: "+1 (555) 456-7890",
      company: "RockFest Promotions",
      notes: "Interested in organizing a 3-day music festival",
    },
    client: {
      name: "Luna Events Corporation",
      email: "bookings@lunaevents.com",
      phone: "+1 (555) 567-8901",
      company: "Luna Events Corp",
      notes: "Annual indie music showcase - 3rd year partnership",
    },
    event: {
      name: "Indie Vibes Music Festival",
      venue: "Central Park Amphitheater",
      description: "Two-day outdoor music festival featuring 12 indie bands and local food vendors",
      maxGuests: 5000,
    },
    tasks: [
      {
        title: "Confirm artist lineup",
        description: "Get signed contracts from all 12 performing bands",
        priority: "URGENT",
        type: "PRE_EVENT",
      },
      {
        title: "Sound system setup",
        description: "Coordinate with audio vendor for stage equipment installation",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Security briefing",
        description: "Review crowd management plan with security team",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Monitor stage transitions",
        description: "Ensure smooth changeovers between performances",
        priority: "URGENT",
        type: "ON_EVENT",
      },
      {
        title: "Equipment breakdown",
        description: "Supervise stage teardown and equipment return",
        priority: "MEDIUM",
        type: "POST_EVENT",
      },
    ],
    itineraries: [
      {
        title: "Gates open & pre-show entertainment",
        offset: -2,
      },
      {
        title: "Opening act - The Echoes",
        offset: 0,
      },
      {
        title: "Second performance - Neon Dreams",
        offset: 1.5,
      },
      {
        title: "Headliner - Midnight Riders",
        offset: 3.5,
      },
      {
        title: "Encore & festival close",
        offset: 5,
      },
    ],
    guests: [
      {
        name: "Alex Martinez",
        email: "alex.martinez@example.com",
        phone: "+1 (555) 678-9012",
      },
      {
        name: "Taylor Chen",
        email: "taylor.chen@example.com",
      },
    ],
    estimate: {
      title: "Music Festival Production Estimate",
      lineItems: [
        {
          serviceCategory: "Stage & Sound",
          description: "Professional sound system and stage setup",
          quantity: 2,
          unit: "days",
          rate: 8500.0,
          tax: 10,
        },
        {
          serviceCategory: "Artist Fees",
          description: "Performance fees for 12 bands",
          quantity: 12,
          unit: "band",
          rate: 2500.0,
          tax: 0,
        },
        {
          serviceCategory: "Security",
          description: "Event security personnel",
          quantity: 20,
          unit: "guards",
          rate: 350.0,
          tax: 10,
        },
      ],
    },
  },
  CONFERENCES: {
    lead: {
      name: "Robert Chen",
      email: "r.chen@techsummit.org",
      phone: "+1 (555) 789-0123",
      company: "Tech Summit Organization",
      notes: "Planning annual technology conference for 500 attendees",
    },
    client: {
      name: "Innovation Hub Inc.",
      email: "events@innovationhub.com",
      phone: "+1 (555) 890-1234",
      company: "Innovation Hub Inc.",
      notes: "Corporate tech summit with keynote speakers and breakout sessions",
    },
    event: {
      name: "Future of Tech Summit 2026",
      venue: "Grand Convention Center",
      description: "Full-day technology conference featuring keynote speakers, panel discussions, and networking sessions",
      maxGuests: 500,
    },
    tasks: [
      {
        title: "Finalize speaker schedule",
        description: "Confirm time slots for all 8 speakers and panelists",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "AV equipment testing",
        description: "Test all microphones, projectors, and presentation systems",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Print attendee badges",
        description: "Prepare name badges and conference materials",
        priority: "MEDIUM",
        type: "PRE_EVENT",
      },
      {
        title: "Registration desk support",
        description: "Staff check-in area and handle attendee questions",
        priority: "HIGH",
        type: "ON_EVENT",
      },
      {
        title: "Collect feedback surveys",
        description: "Gather and compile attendee feedback forms",
        priority: "LOW",
        type: "POST_EVENT",
      },
    ],
    itineraries: [
      {
        title: "Registration & breakfast",
        offset: -1,
      },
      {
        title: "Opening keynote - AI Revolution",
        offset: 0,
      },
      {
        title: "Breakout sessions (Track A & B)",
        offset: 1.5,
      },
      {
        title: "Lunch & networking",
        offset: 3,
      },
      {
        title: "Panel discussion - Future of Work",
        offset: 4.5,
      },
      {
        title: "Closing remarks & networking reception",
        offset: 6,
      },
    ],
    guests: [
      {
        name: "Dr. Priya Sharma",
        email: "priya.sharma@example.com",
        phone: "+1 (555) 901-2345",
      },
      {
        name: "Kevin O'Brien",
        email: "kevin.obrien@example.com",
      },
    ],
    estimate: {
      title: "Conference Services Estimate",
      lineItems: [
        {
          serviceCategory: "Venue Rental",
          description: "Convention center main hall and 4 breakout rooms",
          quantity: 1,
          unit: "day",
          rate: 12000.0,
          tax: 10,
        },
        {
          serviceCategory: "Catering",
          description: "Breakfast, lunch, and refreshments for 500 attendees",
          quantity: 500,
          unit: "person",
          rate: 65.0,
          tax: 10,
        },
        {
          serviceCategory: "AV Equipment",
          description: "Projectors, sound systems, and technical support",
          quantity: 1,
          unit: "package",
          rate: 4500.0,
          tax: 10,
        },
      ],
    },
  },
  OTHERS: {
    lead: {
      name: "Amanda Brooks",
      email: "amanda.brooks@example.com",
      phone: "+1 (555) 012-3456",
      company: "Creative Events Co.",
      notes: "Exploring options for corporate team building event",
    },
    client: {
      name: "Global Enterprises Ltd.",
      email: "hr@globalenterprises.com",
      phone: "+1 (555) 123-7890",
      company: "Global Enterprises Ltd.",
      notes: "Annual company retreat and awards ceremony",
    },
    event: {
      name: "Annual Company Gala & Awards",
      venue: "Riverside Hotel Grand Ballroom",
      description: "Evening gala featuring awards ceremony, dinner, and entertainment for employees and partners",
      maxGuests: 300,
    },
    tasks: [
      {
        title: "Design awards program",
        description: "Create ceremony script and prepare award plaques",
        priority: "MEDIUM",
        type: "PRE_EVENT",
      },
      {
        title: "Book entertainment",
        description: "Confirm jazz band and MC for the evening",
        priority: "HIGH",
        type: "PRE_EVENT",
      },
      {
        title: "Table arrangements",
        description: "Create seating chart based on departments",
        priority: "MEDIUM",
        type: "PRE_EVENT",
      },
      {
        title: "Coordinate award presentations",
        description: "Ensure smooth flow of award announcements",
        priority: "HIGH",
        type: "ON_EVENT",
      },
      {
        title: "Share event photos",
        description: "Upload and distribute professional event photos",
        priority: "LOW",
        type: "POST_EVENT",
      },
    ],
    itineraries: [
      {
        title: "Cocktail reception",
        offset: -1,
      },
      {
        title: "Welcome address",
        offset: 0,
      },
      {
        title: "Dinner service",
        offset: 0.5,
      },
      {
        title: "Awards ceremony",
        offset: 2,
      },
      {
        title: "Live entertainment & dancing",
        offset: 3.5,
      },
    ],
    guests: [
      {
        name: "Jessica Lee",
        email: "jessica.lee@example.com",
        phone: "+1 (555) 234-8901",
      },
      {
        name: "Christopher Davis",
        email: "chris.davis@example.com",
      },
    ],
    estimate: {
      title: "Corporate Gala Estimate",
      lineItems: [
        {
          serviceCategory: "Venue",
          description: "Grand ballroom rental with AV setup",
          quantity: 1,
          unit: "evening",
          rate: 8000.0,
          tax: 10,
        },
        {
          serviceCategory: "Catering",
          description: "Plated dinner and open bar for 300 guests",
          quantity: 300,
          unit: "person",
          rate: 95.0,
          tax: 10,
        },
        {
          serviceCategory: "Entertainment",
          description: "Live jazz band (4 hours)",
          quantity: 1,
          unit: "package",
          rate: 2500.0,
          tax: 10,
        },
      ],
    },
  },
};

/**
 * Seed demo data for a new organization based on event type preference
 * Idempotent - checks if demo data already exists before creating
 */
export async function seedDemoData(eventType: EventType) {
  const { internalOrgId } = await getTenantContext();
  
  const template = templates[eventType];
  const tenantId = internalOrgId;

  return multiTenantDb.forTenant(tenantId).run(async (prisma) => {
    // Check if demo data already exists
    const existingLeadCount = await prisma.lead.count();
    if (existingLeadCount > 0) {
      // Demo data already exists, return success without creating duplicates
      return {
        success: true,
        alreadyExists: true,
        counts: {
          leads: existingLeadCount,
          clients: await prisma.client.count(),
          events: await prisma.event.count(),
          tasks: await prisma.task.count(),
          itineraries: await prisma.itinerary.count(),
          guests: await prisma.guest.count(),
          estimates: await prisma.estimate.count(),
        },
      };
    }
    // Calculate event dates (30 days from now)
    const eventStartDate = new Date();
    eventStartDate.setDate(eventStartDate.getDate() + 30);
    eventStartDate.setHours(14, 0, 0, 0); // 2 PM

    const eventEndDate = new Date(eventStartDate);
    eventEndDate.setHours(22, 0, 0, 0); // 10 PM

    // 1. Create demo lead
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        ...template.lead,
        status: "CONTACTED",
      },
    });

    // 2. Create demo client
    const client = await prisma.client.create({
      data: {
        tenantId,
        ...template.client,
      },
    });

    // 3. Create demo event
    const event = await prisma.event.create({
      data: {
        tenantId,
        clientId: client.id,
        ...template.event,
        startDate: eventStartDate,
        endDate: eventEndDate,
        registrationEndDate: new Date(eventStartDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
      },
    });

    // 4. Create demo tasks for the event
    const taskDueDates = template.tasks.map((_, index) => {
      const dueDate = new Date(eventStartDate);
      dueDate.setDate(dueDate.getDate() - (template.tasks.length - index) * 3); // Spread tasks before event
      return dueDate;
    });

    await Promise.all(
      template.tasks.map((task, index) =>
        prisma.task.create({
          data: {
            tenantId,
            eventId: event.id,
            ...task,
            dueDate: taskDueDates[index],
            status: index === 0 ? "IN_PROGRESS" : "TO_DO",
          },
        })
      )
    );

    // 5. Create demo itinerary items
    await Promise.all(
      template.itineraries.map((item) => {
        const itemDate = new Date(eventStartDate);
        itemDate.setHours(itemDate.getHours() + item.offset);
        return prisma.itinerary.create({
          data: {
            tenantId,
            eventId: event.id,
            title: item.title,
            date: itemDate,
          },
        });
      })
    );

    // 6. Create demo guests
    await Promise.all(
      template.guests.map((guest) =>
        prisma.guest.create({
          data: {
            tenantId,
            eventId: event.id,
            ...guest,
          },
        })
      )
    );

    // 7. Create demo estimate
    const estimateLineItems = template.estimate.lineItems.map((item, index) => ({
      id: `line-${index + 1}`, // Add unique ID for each line item
      ...item,
      amount: item.quantity * item.rate * (1 + item.tax / 100),
    }));

    await prisma.estimate.create({
      data: {
        tenantId,
        clientId: client.id,
        eventId: event.id,
        leadId: lead.id,
        ...template.estimate,
        eventName: template.event.name,
        eventVenue: template.event.venue,
        eventStartDate,
        eventEndDate,
        status: "SENT",
        lineItems: estimateLineItems,
      },
    });

    return {
      success: true,
      alreadyExists: false,
      counts: {
        leads: 1,
        clients: 1,
        events: 1,
        tasks: template.tasks.length,
        itineraries: template.itineraries.length,
        guests: template.guests.length,
        estimates: 1,
      },
    };
  });
}
