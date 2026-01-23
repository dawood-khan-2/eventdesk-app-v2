"use server";

import { auth } from "@repo/auth/server";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SignJWT } from "jose";
import { resend } from "@repo/email";
import { FeedbackRequestTemplate } from "@repo/email/templates/feedback-request";
import { RegistrationLinkTemplate } from "@repo/email/templates/registration-link";
import { env } from "@/env";
import { getInternalOrgId, getTenantContext } from "../lib/auth-helpers";

/**
 * Event filter types
 */
export type EventFilter = "UPCOMING" | "ONGOING" | "COMPLETED";

/**
 * Validation Schemas
 */
const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(255),
  leadOrClientId: z.string().cuid("Invalid lead/client ID"),
  leadOrClientType: z.enum(["lead", "client"]),
  estimateId: z.string().cuid().optional(),
  venue: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  maxGuests: z.number().int().positive().optional(),
  registrationEndDate: z.string().datetime("Invalid registration end date").optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const now = new Date();
    return start >= now;
  },
  {
    message: "Event cannot be created in the past",
    path: ["startDate"],
  }
);

const updateEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Event name is required").max(255).optional(),
  venue: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  maxGuests: z.number().int().positive().optional(),
  registrationEndDate: z.string().datetime("Invalid registration end date").optional(),
}).refine(
  (data) => {
    // Only validate dates if both are provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    }
    return true;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
);

const searchEventsSchema = z.object({
  query: z.string().optional(),
  filter: z.enum(["UPCOMING", "ONGOING", "COMPLETED"]).optional(),
  clientId: z.string().cuid().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Helper to determine event filter based on dates
 */
function getEventFilterCondition(filter: EventFilter) {
  const now = new Date();

  switch (filter) {
    case "UPCOMING":
      return {
        startDate: { gt: now },
      };
    case "ONGOING":
      return {
        AND: [
          { startDate: { lte: now } },
          { endDate: { gte: now } },
        ],
      };
    case "COMPLETED":
      return {
        endDate: { lt: now },
      };
  }
}

/**
 * Create a new event
 * This function handles the entire transaction: convert lead to client (if needed), create event, and link estimate
 * All operations are wrapped in a single transaction via multiTenantDb with automatic rollback on failure
 */
export async function createEvent(data: z.infer<typeof createEventSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = createEventSchema.parse(data);

    // Get internal organization ID
    const internalOrgId = await getInternalOrgId(orgId);

    // Execute entire flow in a single transaction with automatic rollback on failure
    // The prisma object here is already a TransactionClient
    const event = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      let clientId = validatedData.leadOrClientId;

      // Step 1: Convert lead to client if needed
      if (validatedData.leadOrClientType === "lead") {
        // Get the lead
        const lead = await prisma.lead.findUnique({
          where: { id: validatedData.leadOrClientId },
        });

        if (!lead) {
          throw new Error("Lead not found");
        }

        // Check if lead is already converted
        if (lead.status === "CONVERTED") {
          throw new Error("Lead has already been converted to a client");
        }

        // Create client from lead data
        const client = await prisma.client.create({
          data: {
            tenantId: internalOrgId,
            leadId: lead.id, // Keep reference to original lead
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            address: lead.address,
            notes: lead.notes,
          },
        });

        // Mark lead as CONVERTED
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: "CONVERTED" },
        });

        // Update all estimates with this leadId to point to the new client
        await prisma.estimate.updateMany({
          where: { leadId: lead.id },
          data: { clientId: client.id },
        });

        clientId = client.id;
      } else {
        // Verify client exists and belongs to this organization
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: { id: true },
        });

        if (!client) {
          throw new Error("Client not found");
        }
      }

      // Step 2: Create event
      const newEvent = await prisma.event.create({
        data: {
          tenantId: internalOrgId,
          name: validatedData.name,
          clientId: clientId,
          venue: validatedData.venue || null,
          description: validatedData.description || null,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      // Step 3: Link estimate to event if provided
      if (validatedData.estimateId) {
        // Verify estimate exists and belongs to the client
        const estimate = await prisma.estimate.findUnique({
          where: { id: validatedData.estimateId },
          select: { id: true, clientId: true, leadId: true },
        });

        if (!estimate) {
          throw new Error("Estimate not found");
        }

        // Verify estimate belongs to the selected client/lead
        if (estimate.clientId !== clientId && estimate.leadId !== validatedData.leadOrClientId) {
          throw new Error("Estimate does not belong to the selected client/lead");
        }

        await prisma.estimate.update({
          where: { id: validatedData.estimateId },
          data: { eventId: newEvent.id },
        });
      }

      return newEvent;
    });

    revalidatePath("/events");
    revalidatePath("/leads");
    return { data: event };
  } catch (error) {
    console.error("Failed to create event:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    // Handle specific transaction errors
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to create event" };
  }
}


/**
 * Get all events for the current organization
 */
export async function getEvents(options?: {
  filter?: EventFilter;
  clientId?: string;
  limit?: number;
  cursor?: string;
  offset?: number;
}) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const events = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.findMany({
        where: {
          ...(options?.filter && getEventFilterCondition(options.filter)),
          ...(options?.clientId && { clientId: options.clientId }),
          ...(options?.cursor && {
            id: { lt: options.cursor },
          }),
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      });
    });

    return { data: events };
  } catch (error) {
    console.error("Failed to get events:", error);
    return { error: "Failed to get events" };
  }
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string) {
  try {
    if (!id) {
      return { error: "Event ID is required" };
    }

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const event = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    if (!event) {
      return { error: "Event not found" };
    }

    return { data: event };
  } catch (error) {
    console.error("Failed to get event:", error);
    return { error: "Failed to get event" };
  }
}

/**
 * Update an event
 */
export async function updateEvent(data: z.infer<typeof updateEventSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = updateEventSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const internalOrgId = await getInternalOrgId(orgId);

    // Prepare update data with proper date conversion
    const dataToUpdate: any = {};
    
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.venue !== undefined) dataToUpdate.venue = updateData.venue || null;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description || null;
    if (updateData.startDate !== undefined) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) dataToUpdate.endDate = new Date(updateData.endDate);
    if (updateData.maxGuests !== undefined) dataToUpdate.maxGuests = updateData.maxGuests || null;
    if (updateData.registrationEndDate !== undefined) dataToUpdate.registrationEndDate = updateData.registrationEndDate ? new Date(updateData.registrationEndDate) : null;

    // Update event with tenant context (RLS ensures we can only update our own events)
    const event = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.update({
        where: { id },
        data: dataToUpdate,
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    return { data: event };
  } catch (error) {
    console.error("Failed to update event:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to update event" };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  try {
    if (!id) {
      return { error: "Event ID is required" };
    }

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    // Delete event with tenant context (RLS ensures we can only delete our own events)
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.delete({
        where: { id },
      });
    });

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { error: "Failed to delete event" };
  }
}

/**
 * Search events by name, venue, description, or client name
 */
export async function searchEvents(options: z.infer<typeof searchEventsSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const validatedOptions = searchEventsSchema.parse(options);
    const internalOrgId = await getInternalOrgId(orgId);

    const events = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.findMany({
        where: {
          ...(validatedOptions.filter && getEventFilterCondition(validatedOptions.filter)),
          ...(validatedOptions.clientId && { clientId: validatedOptions.clientId }),
          ...(validatedOptions.query && {
            OR: [
              { name: { contains: validatedOptions.query, mode: "insensitive" } },
              { venue: { contains: validatedOptions.query, mode: "insensitive" } },
              { description: { contains: validatedOptions.query, mode: "insensitive" } },
              { client: { name: { contains: validatedOptions.query, mode: "insensitive" } } },
            ],
          }),
          ...(validatedOptions.cursor && {
            id: { lt: validatedOptions.cursor },
          }),
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
        skip: validatedOptions.offset ?? 0,
        take: validatedOptions.limit,
      });
    });

    return { data: events };
  } catch (error) {
    console.error("Failed to search events:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid search parameters" };
    }
    
    return { error: "Failed to search events" };
  }
}

/**
 * Get events statistics
 */
export async function getEventsStats() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);
    const now = new Date();

    const stats = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      const [total, upcoming, ongoing, completed] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { startDate: { gt: now } } }),
        prisma.event.count({
          where: {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
        }),
        prisma.event.count({ where: { endDate: { lt: now } } }),
      ]);

      return {
        total,
        byFilter: {
          UPCOMING: upcoming,
          ONGOING: ongoing,
          COMPLETED: completed,
        },
      };
    });

    return { data: stats };
  } catch (error) {
    console.error("Failed to get events stats:", error);
    return { error: "Failed to get events stats" };
  }
}

/**
 * Get estimates for a specific lead or client
 */
export async function getEstimatesForLeadOrClient(id: string, type: "lead" | "client") {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const estimates = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.estimate.findMany({
        where: type === "lead" ? { leadId: id } : { clientId: id },
        select: {
          id: true,
          title: true,
          eventName: true,
          eventVenue: true,
          eventStartDate: true,
          eventEndDate: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });

    return { data: estimates };
  } catch (error) {
    console.error("Failed to get estimates:", error);
    return { error: "Failed to fetch estimates" };
  }
}

/**
 * Generate JWT token for feedback request
 */
export async function generateFeedbackToken(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Create JWT token with eventId and tenantId
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ 
      eventId, 
      tenantId: internalOrgId 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("48h") // Token expires in 48 hours
      .sign(secret);

    return { data: token };
  } catch (error) {
    console.error("Failed to generate feedback token:", error);
    return { error: "Failed to generate token" };
  }
}

/**
 * Generate JWT token for guest registration
 */
export async function generateRegistrationToken(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch event to get registration deadline
    const event = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          registrationEndDate: true,
          endDate: true,
        },
      })
    );

    if (!event) {
      return { error: "Event not found" };
    }

    // Determine token expiration with buffer for better error messages
    // We add a 30-day buffer so the token remains valid even after the deadline,
    // allowing our application logic to provide meaningful error messages
    // instead of generic "Invalid token" errors
    let expirationTime: string | Date;
    const now = new Date();

    if (event.registrationEndDate) {
      // If registration deadline exists, check if it has already passed
      if (event.registrationEndDate <= now) {
        return { error: "Registration deadline has already passed" };
      }
      // Add 30-day buffer beyond registration deadline (industry standard)
      const bufferDate = new Date(event.registrationEndDate);
      bufferDate.setDate(bufferDate.getDate() + 30);
      expirationTime = bufferDate;
    } else if (event.endDate) {
      // Fall back to event end date + 30-day buffer
      const bufferDate = new Date(event.endDate);
      bufferDate.setDate(bufferDate.getDate() + 30);
      expirationTime = bufferDate;
    } else {
      // Fall back to 30 days if neither is set
      expirationTime = "30d";
    }

    // Create JWT token with eventId and tenantId
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ 
      eventId, 
      tenantId: internalOrgId 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secret);

    return { data: token };
  } catch (error) {
    console.error("Failed to generate registration token:", error);
    return { error: "Failed to generate token" };
  }
}

/**
 * Request feedback for an event
 */
export async function requestFeedback(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch event details
    const event = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          venue: true,
          startDate: true,
          endDate: true,
          rating: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    );

    if (!event) {
      return { error: "Event not found" };
    }

    // Check if event has ended
    if (!event.endDate || event.endDate > new Date()) {
      return { error: "Cannot request feedback for an ongoing or upcoming event" };
    }

    // Check if feedback already submitted
    if (event.rating !== null) {
      return { error: "Feedback has already been submitted for this event" };
    }

    // Check if client has email
    if (!event.client.email) {
      return { error: "Client email not found" };
    }

    // Generate token
    const tokenResult = await generateFeedbackToken(eventId);
    if (tokenResult.error || !tokenResult.data) {
      return { error: tokenResult.error || "Failed to generate token" };
    }

    // Send email
    const feedbackUrl = `${env.NEXT_PUBLIC_APP_URL}/feedback/${eventId}?token=${tokenResult.data}`;
    
    // Format event date
    const eventDate = event.startDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }) + (event.endDate && event.endDate.getTime() !== event.startDate.getTime() 
      ? ` - ${event.endDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      : "");
    
    const { error: emailError } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: event.client.email,
      subject: `Share your feedback for ${event.name}`,
      react: FeedbackRequestTemplate({
        eventName: event.name,
        clientName: event.client.name,
        eventVenue: event.venue || undefined,
        eventDate,
        feedbackUrl,
      }),
    });

    if (emailError) {
      console.error("Failed to send feedback email:", emailError);
      return { error: "Failed to send feedback email" };
    }

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to request feedback:", error);
    return { error: "Failed to get estimates" };
  }
}

/**
 * Send registration link for an event
 */
export async function sendRegistrationLink(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch event details
    const event = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          venue: true,
          startDate: true,
          endDate: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    );

    if (!event) {
      return { error: "Event not found" };
    }

    // Check if event has ended
    if (event.endDate && event.endDate < new Date()) {
      return { error: "Cannot send registration link for a past event" };
    }

    // Check if client has email
    if (!event.client.email) {
      return { error: "Client email not found" };
    }

    // Generate token
    const tokenResult = await generateRegistrationToken(eventId);
    if (tokenResult.error || !tokenResult.data) {
      return { error: tokenResult.error || "Failed to generate token" };
    }

    // Send email
    const registrationUrl = `${env.NEXT_PUBLIC_APP_URL}/register/${eventId}?token=${tokenResult.data}`;
    
    // Format event date
    const eventDate = event.startDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }) + (event.endDate && event.endDate.getTime() !== event.startDate.getTime() 
      ? ` - ${event.endDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      : "");
    
    const { error: emailError } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: event.client.email,
      subject: `Registration link for ${event.name}`,
      react: RegistrationLinkTemplate({
        eventName: event.name,
        clientName: event.client.name,
        eventVenue: event.venue || undefined,
        eventDate,
        registrationUrl,
      }),
    });

    if (emailError) {
      console.error("Failed to send registration email:", emailError);
      return { error: "Failed to send registration email" };
    }

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send registration link:", error);
    return { error: "Failed to send registration link" };
  }
}
