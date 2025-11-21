"use server";

import { auth } from "@repo/auth/server";
import { database, multiTenantDb } from "@repo/database";
import type { Lead, LeadStatus } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Validation Schemas
 */
const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "CONVERTED", "LOST"]).default("NEW"),
  notes: z.string().optional().or(z.literal("")),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().cuid(),
});

const searchLeadsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "CONVERTED", "LOST"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Helper to get the internal organization ID from Clerk's orgId
 */
async function getInternalOrgId(clerkOrgId: string): Promise<string> {
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { id: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return org.id;
}

/**
 * Create a new lead
 */
export async function createLead(data: z.infer<typeof createLeadSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = createLeadSchema.parse(data);

    // Get internal organization ID
    const internalOrgId = await getInternalOrgId(orgId);

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
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

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

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

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
 */
export async function updateLead(data: z.infer<typeof updateLeadSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = updateLeadSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const internalOrgId = await getInternalOrgId(orgId);

    // Update lead with tenant context (RLS ensures we can only update our own leads)
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

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

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
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const validatedOptions = searchLeadsSchema.parse(options);
    const internalOrgId = await getInternalOrgId(orgId);

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

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

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
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

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
