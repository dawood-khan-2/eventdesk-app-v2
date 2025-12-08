"use server";

import { auth } from "@repo/auth/server";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getInternalOrgId } from "../lib/auth-helpers";

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
  id: z.string().cuid(),
  name: z.string().min(1, "Event name is required").max(255).optional(),
  venue: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
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

    // Update event with tenant context (RLS ensures we can only update our own events)
    const event = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.event.update({
        where: { id },
        data: dataToUpdate,
        include: {
          client: {
            select: {
              name: true,
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
    return { error: "Failed to get estimates" };
  }
}
