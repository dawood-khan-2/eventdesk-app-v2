"use server";

import { multiTenantDb } from "@repo/database";
import type { Lead, LeadStatus } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";

/**
 * Validation Schemas
 */
const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "LOST"]).default("NEW"),
  notes: z.string().optional().or(z.literal("")),
});

const updateLeadSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(255).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "CONVERTED", "LOST"]).optional(),
  notes: z.string().optional().or(z.literal("")),
});

const searchLeadsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "CONVERTED", "LOST"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Create a new lead
 */
export async function createLead(data: z.infer<typeof createLeadSchema>) {
  try {
    // Validate input
    const validatedData = createLeadSchema.parse(data);

    // Get internal organization ID
    const { internalOrgId } = await getTenantContext();

    // Create lead with tenant context
    const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.create({
        data: {
          ...validatedData,
          tenantId: internalOrgId,
        },
      });
    });

    revalidatePath("/leads");
    return { data: lead };
  } catch (error) {
    console.error("Failed to create lead:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to create lead" };
  }
}

/**
 * Get all leads for the current organization
 */
export async function getLeads(options?: {
  status?: LeadStatus;
  limit?: number;
  cursor?: string;
  offset?: number;
}) {
  try {
    const { internalOrgId } = await getTenantContext();

    const leads = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.findMany({
        where: {
          status: options?.status,
          ...(options?.cursor && {
            id: { lt: options.cursor },
          }),
        },
        orderBy: { createdAt: "desc" },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      });
    });

    return { data: leads };
  } catch (error) {
    console.error("Failed to get leads:", error);
    return { error: "Failed to get leads" };
  }
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string) {
  try {
    if (!id) {
      return { error: "Lead ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.findUnique({
        where: { id },
      });
    });

    if (!lead) {
      return { error: "Lead not found" };
    }

    return { data: lead };
  } catch (error) {
    console.error("Failed to get lead:", error);
    return { error: "Failed to get lead" };
  }
}

/**
 * Update a lead
 * If status is changed to CONVERTED, automatically creates a client in a single transaction
 */
export async function updateLead(data: z.infer<typeof updateLeadSchema>) {
  try {
    // Validate input
    const validatedData = updateLeadSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const { internalOrgId } = await getTenantContext();

    // Check if status is being changed to CONVERTED
    if (updateData.status === "CONVERTED") {
      // Perform entire conversion in a single transaction
      const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
        // Get the lead with full data
        const currentLead = await prisma.lead.findUnique({
          where: { id },
        });

        if (!currentLead) {
          throw new Error("Lead not found");
        }

        // If already converted, check for existing client (idempotency)
        if (currentLead.status === "CONVERTED") {
          const existingClient = await prisma.client.findFirst({
            where: { leadId: id },
          });

          if (existingClient) {
            // Already converted, just update other fields if any
            if (Object.keys(updateData).length > 1) {
              return prisma.lead.update({
                where: { id },
                data: updateData,
              });
            }
            return currentLead;
          }
          // If marked as CONVERTED but no client exists (orphaned state), continue with conversion
        }

        // Create client from lead data
        const client = await prisma.client.create({
          data: {
            tenantId: internalOrgId,
            leadId: id,
            name: currentLead.name,
            email: currentLead.email,
            phone: currentLead.phone,
            company: currentLead.company,
            address: currentLead.address,
            notes: currentLead.notes,
          },
        });

        // Update all estimates with this leadId to point to the new client
        await prisma.estimate.updateMany({
          where: { leadId: id },
          data: { clientId: client.id },
        });

        // Update lead to CONVERTED along with any other field updates
        return prisma.lead.update({
          where: { id },
          data: { ...updateData, status: "CONVERTED" },
        });
      });

      revalidatePath("/leads");
      revalidatePath("/clients");
      revalidatePath(`/leads/${id}`);
      return { data: lead };
    }

    // Regular update (not converting to client)
    const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.update({
        where: { id },
        data: updateData,
      });
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    return { data: lead };
  } catch (error) {
    console.error("Failed to update lead:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    // Handle specific transaction errors
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to update lead" };
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string) {
  try {
    if (!id) {
      return { error: "Lead ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    // Delete lead with tenant context (RLS ensures we can only delete our own leads)
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.delete({
        where: { id },
      });
    });

    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { error: "Failed to delete lead" };
  }
}

/**
 * Search leads by name, email, company, etc.
 */
export async function searchLeads(options: z.infer<typeof searchLeadsSchema>) {
  try {
    const validatedOptions = searchLeadsSchema.parse(options);
    const { internalOrgId } = await getTenantContext();

    const leads = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.findMany({
        where: {
          ...(validatedOptions.status && { status: validatedOptions.status }),
          ...(validatedOptions.query && {
            OR: [
              { name: { contains: validatedOptions.query, mode: "insensitive" } },
              { email: { contains: validatedOptions.query, mode: "insensitive" } },
              { company: { contains: validatedOptions.query, mode: "insensitive" } },
              { phone: { contains: validatedOptions.query, mode: "insensitive" } },
            ],
          }),
          ...(validatedOptions.cursor && {
            id: { lt: validatedOptions.cursor },
          }),
        },
        orderBy: { createdAt: "desc" },
        skip: validatedOptions.offset ?? 0,
        take: validatedOptions.limit,
      });
    });

    return { data: leads };
  } catch (error) {
    console.error("Failed to search leads:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid search parameters" };
    }
    
    return { error: "Failed to search leads" };
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id: string, status: LeadStatus) {
  try {    
    if (!id || !status) {
      return { error: "Lead ID and status are required" };
    }

    const { internalOrgId } = await getTenantContext();

    const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.update({
        where: { id },
        data: { status },
      });
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    return { data: lead };
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return { error: "Failed to update lead status" };
  }
}

/**
 * Get leads count by status
 */
export async function getLeadsStats() {
  try {
    const { internalOrgId } = await getTenantContext();

    const stats = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      const [total, newCount, contacted, proposalSent, followUp, converted, lost] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.lead.count({ where: { status: "CONTACTED" } }),
        prisma.lead.count({ where: { status: "PROPOSAL_SENT" } }),
        prisma.lead.count({ where: { status: "FOLLOW_UP" } }),
        prisma.lead.count({ where: { status: "CONVERTED" } }),
        prisma.lead.count({ where: { status: "LOST" } }),
      ]);

      return {
        total,
        byStatus: {
          NEW: newCount,
          CONTACTED: contacted,
          PROPOSAL_SENT: proposalSent,
          FOLLOW_UP: followUp,
          CONVERTED: converted,
          LOST: lost,
        },
      };
    });

    return { data: stats };
  } catch (error) {
    console.error("Failed to get leads stats:", error);
    return { error: "Failed to get leads stats" };
  }
}
