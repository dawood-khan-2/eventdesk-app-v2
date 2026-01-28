"use server";

import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../../lib/auth-helpers";
import { resend } from "@repo/email";
import { GuestsListTemplate } from "@repo/email/templates/guests-list";
import { render } from "@react-email/render";
import { env } from "@/env";

/**
 * Validation Schema for Task Creation
 */
const createTaskSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
  title: z.string().min(1, "Task title is required").max(255),
  description: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")), // ISO date string
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TO_DO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  type: z.enum(["PRE_EVENT", "ON_EVENT", "POST_EVENT"]),
  parentTaskId: z.string().cuid().optional(),
  checklistItems: z.array(z.object({
    title: z.string().min(1, "Checklist item cannot be empty"),
  })).optional(),
});

/**
 * Create a new task with optional checklist items
 */
export async function createTask(data: z.infer<typeof createTaskSchema>) {
  try {
    // Validate input
    const validatedData = createTaskSchema.parse(data);

    const { internalOrgId } = await getTenantContext();

    // Create task with checklists in a transaction
    const task = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify event exists and belongs to this organization
      const event = await prisma.event.findUnique({
        where: { id: validatedData.eventId },
        select: { id: true },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Create task
      const newTask = await prisma.task.create({
        data: {
          tenantId: internalOrgId,
          eventId: validatedData.eventId,
          title: validatedData.title,
          description: validatedData.description || null,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          priority: validatedData.priority,
          status: validatedData.status,
          type: validatedData.type,
          parentTaskId: validatedData.parentTaskId || null,
          // Create checklists if provided
          checklists: validatedData.checklistItems && validatedData.checklistItems.length > 0
            ? {
                create: validatedData.checklistItems.map(item => ({
                  tenantId: internalOrgId,
                  title: item.title,
                  done: false,
                })),
              }
            : undefined,
        },
        include: {
          checklists: true,
        },
      });

      return newTask;
    });

    revalidatePath(`/events/${validatedData.eventId}`);
    return { data: task };
  } catch (error) {
    console.error("Failed to create task:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to create task" };
  }
}

/**
 * Get all tasks for an event
 */
export async function getTasks(eventId: string) {
  try {
    if (!eventId) {
      return { error: "Event ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const tasks = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.task.findMany({
        where: { 
          eventId,
          parentTaskId: null, // Only get top-level tasks
        },
        include: {
          checklists: {
            orderBy: { createdAt: 'asc' },
          },
          subtasks: {
            include: {
              checklists: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // TO_DO first
          { priority: 'desc' }, // URGENT first
          { dueDate: 'asc' },
        ],
      });
    });

    return { data: tasks };
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return { error: "Failed to get tasks" };
  }
}

/**
 * Get single task with full details
 */
export async function getTask(taskId: string) {
  try {
    if (!taskId) {
      return { error: "Task ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const task = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.task.findUnique({
        where: { id: taskId },
        include: {
          checklists: {
            orderBy: { createdAt: 'asc' },
          },
          subtasks: {
            include: {
              checklists: {
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: [
              { status: 'asc' },
              { priority: 'desc' },
              { dueDate: 'asc' },
            ],
          },
          parentTask: {
            select: { id: true, title: true },
          },
          event: {
            select: { id: true, name: true },
          },
        },
      });
    });

    if (!task) {
      return { error: "Task not found" };
    }

    return { data: task };
  } catch (error) {
    console.error("Failed to get task:", error);
    return { error: "Failed to get task" };
  }
}

/**
 * Validation Schema for Task Update
 */
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TO_DO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  type: z.enum(["PRE_EVENT", "ON_EVENT", "POST_EVENT"]).optional(),
});

/**
 * Update task fields
 */
export async function updateTask(taskId: string, data: z.infer<typeof updateTaskSchema>) {
  try {
    if (!taskId) {
      return { error: "Task ID is required" };
    }

    // Validate input
    const validatedData = updateTaskSchema.parse(data);

    const { internalOrgId } = await getTenantContext();

    const task = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify task exists
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, eventId: true },
      });

      if (!existingTask) {
        throw new Error("Task not found");
      }

      // If priority or type is being updated, also update all subtasks
      if (validatedData.priority !== undefined || validatedData.type !== undefined) {
        const updateData: any = {};
        if (validatedData.priority !== undefined) {
          updateData.priority = validatedData.priority;
        }
        if (validatedData.type !== undefined) {
          updateData.type = validatedData.type;
        }

        await prisma.task.updateMany({
          where: { parentTaskId: taskId },
          data: updateData,
        });
      }

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...validatedData,
          dueDate: validatedData.dueDate !== undefined
            ? validatedData.dueDate ? new Date(validatedData.dueDate) : null
            : undefined,
        },
        include: {
          checklists: true,
        },
      });

      revalidatePath(`/events/${existingTask.eventId}`);
      return updatedTask;
    });

    return { data: task };
  } catch (error) {
    console.error("Failed to update task:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to update task" };
  }
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(
  itemId: string,
  data: { title?: string; done?: boolean }
) {
  try {
    if (!itemId) {
      return { error: "Checklist item ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const item = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify item exists
      const existingItem = await prisma.checklist.findUnique({
        where: { id: itemId },
        select: { 
          id: true, 
          task: { 
            select: { eventId: true } 
          } 
        },
      });

      if (!existingItem) {
        throw new Error("Checklist item not found");
      }

      // Update item
      const updatedItem = await prisma.checklist.update({
        where: { id: itemId },
        data: {
          title: data.title,
          done: data.done,
        },
      });

      revalidatePath(`/events/${existingItem.task.eventId}`);
      return updatedItem;
    });

    return { data: item };
  } catch (error) {
    console.error("Failed to update checklist item:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to update checklist item" };
  }
}

/**
 * Delete checklist item
 */
export async function deleteChecklistItem(itemId: string) {
  try {
    if (!itemId) {
      return { error: "Checklist item ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify item exists
      const existingItem = await prisma.checklist.findUnique({
        where: { id: itemId },
        select: { 
          id: true, 
          task: { 
            select: { eventId: true } 
          } 
        },
      });

      if (!existingItem) {
        throw new Error("Checklist item not found");
      }

      // Delete item
      await prisma.checklist.delete({
        where: { id: itemId },
      });

      revalidatePath(`/events/${existingItem.task.eventId}`);
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete checklist item:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to delete checklist item" };
  }
}

/**
 * Create checklist item
 */
export async function createChecklistItem(taskId: string, title: string) {
  try {
    if (!taskId) {
      return { error: "Task ID is required" };
    }

    if (!title || !title.trim()) {
      return { error: "Checklist item title is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const item = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify task exists
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, eventId: true },
      });

      if (!existingTask) {
        throw new Error("Task not found");
      }

      // Create item
      const newItem = await prisma.checklist.create({
        data: {
          tenantId: internalOrgId,
          taskId,
          title: title.trim(),
          done: false,
        },
      });

      revalidatePath(`/events/${existingTask.eventId}`);
      return newItem;
    });

    return { data: item };
  } catch (error) {
    console.error("Failed to create checklist item:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to create checklist item" };
  }
}

/**
 * Validation Schema for Itinerary Creation
 */
const createItinerariesSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
  items: z.array(z.object({
    title: z.string().min(1, "Itinerary item title is required").max(255),
    date: z.string(), // ISO date string with time
  })).min(1, "At least one itinerary item is required"),
});

/**
 * Create multiple itinerary items in bulk
 */
export async function createItineraries(
  eventId: string,
  items: Array<{ title: string; date: string }>
) {
  try {
    // Validate input
    const validatedData = createItinerariesSchema.parse({ eventId, items });

    const { internalOrgId } = await getTenantContext();

    // Create itinerary items
    const itineraries = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify event exists and belongs to this organization
      const event = await prisma.event.findUnique({
        where: { id: validatedData.eventId },
        select: { id: true },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Create all itinerary items
      const createdItems = await prisma.itinerary.createMany({
        data: validatedData.items.map((item) => ({
          tenantId: internalOrgId,
          eventId: validatedData.eventId,
          title: item.title,
          date: new Date(item.date),
        })),
      });

      return createdItems;
    });

    revalidatePath(`/events/${validatedData.eventId}`);
    return { data: itineraries };
  } catch (error) {
    console.error("Failed to create itinerary items:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to create itinerary items" };
  }
}

/**
 * Get all itineraries for an event, grouped by date
 */
export async function getItineraries(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch itineraries
    const itineraries = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify event exists and belongs to this organization
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Get all itineraries for this event, ordered by date
      return prisma.itinerary.findMany({
        where: { eventId },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          title: true,
          date: true,
          createdAt: true,
        },
      });
    });

    return { data: itineraries };
  } catch (error) {
    console.error("Failed to fetch itineraries:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to fetch itineraries" };
  }
}

/**
 * Validation Schema for Itinerary Update
 */
const updateItinerarySchema = z.object({
  id: z.string().cuid("Invalid itinerary ID"),
  title: z.string().min(1, "Title is required").max(255).optional(),
  date: z.string().optional(), // ISO date string
});

/**
 * Update an itinerary item
 */
export async function updateItinerary(data: { id: string; title?: string; date?: string }) {
  try {
    // Validate input
    const validatedData = updateItinerarySchema.parse(data);

    const { internalOrgId } = await getTenantContext();

    // Update itinerary
    const itinerary = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify itinerary exists and belongs to this organization
      const existing = await prisma.itinerary.findUnique({
        where: { id: validatedData.id },
        select: { id: true, eventId: true },
      });

      if (!existing) {
        throw new Error("Itinerary item not found");
      }

      // Update itinerary
      const updateData: any = {};
      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);

      const updated = await prisma.itinerary.update({
        where: { id: validatedData.id },
        data: updateData,
      });

      revalidatePath(`/events/${existing.eventId}`);
      return updated;
    });

    return { data: itinerary };
  } catch (error) {
    console.error("Failed to update itinerary:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to update itinerary" };
  }
}

/**
 * Delete an itinerary item
 */
export async function deleteItinerary(id: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Delete itinerary
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify itinerary exists and belongs to this organization
      const existing = await prisma.itinerary.findUnique({
        where: { id },
        select: { id: true, eventId: true },
      });

      if (!existing) {
        throw new Error("Itinerary item not found");
      }

      await prisma.itinerary.delete({
        where: { id },
      });

      revalidatePath(`/events/${existing.eventId}`);
    });

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete itinerary:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to delete itinerary" };
  }
}

/**
 * Get all guests for a specific event
 */
export async function getGuests(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch guests
    const guests = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Verify event exists and belongs to this organization
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Get all guests for this event
      return await prisma.guest.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
      });
    });

    return { data: guests };
  } catch (error) {
    console.error("Failed to fetch guests:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to fetch guests" };
  }
}

/**
 * Helper function to generate CSV from guests data
 */
function generateGuestsCSV(guests: Array<{ name: string; email: string; phone: string | null }>): string {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  
  // CSV header
  const header = "Serial Number,Name,Email,Phone\n";
  
  // CSV rows
  const rows = guests.map((guest, index) => {
    const serialNumber = index + 1;
    const name = `"${guest.name.replace(/"/g, '""')}"`;
    const email = guest.email ? `"${guest.email.replace(/"/g, '""')}"` : '""';
    const phone = guest.phone ? `"${guest.phone.replace(/"/g, '""')}"` : '""';
    
    return `${serialNumber},${name},${email},${phone}`;
  }).join("\n");
  
  return BOM + header + rows;
}

/**
 * Send guests list via email with CSV attachment
 */
export async function sendGuestsList(eventId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Fetch event, client, and guests
    const result = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          venue: true,
          startDate: true,
          endDate: true,
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      if (!event.client.email) {
        throw new Error("Client email not found");
      }

      const guests = await prisma.guest.findMany({
        where: { eventId },
        select: {
          name: true,
          email: true,
          phone: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return { event, guests };
    });

    const { event, guests } = result;

    // Check if there are any guests
    if (guests.length === 0) {
      return { error: "No guests have registered yet. Cannot send empty guest list." };
    }

    // Generate CSV
    const csvContent = generateGuestsCSV(guests);
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    // Format date for display
    const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Format filename-safe event name and date
    const safeEventName = event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `${safeEventName}-guests-${fileDate}.csv`;

    // Render email template
    const emailHtml = await render(
      GuestsListTemplate({
        clientName: event.client.name,
        eventName: event.name,
        eventDate,
        eventVenue: event.venue || undefined,
        guestCount: guests.length,
      })
    );

    // Send email with CSV attachment
    const { error: emailError } = await resend.emails.send({
      from: `EventDesk <${env.RESEND_FROM}>`,
      to: event.client.email as string, // Already validated above
      subject: `Guests List for ${event.name}`,
      html: emailHtml,
      attachments: [
        {
          filename,
          content: csvBuffer,
        },
      ],
    });

    if (emailError) {
      console.error("Failed to send guests list email:", emailError);
      return { error: "Failed to send guests list email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send guests list:", error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to send guests list" };
  }
}
