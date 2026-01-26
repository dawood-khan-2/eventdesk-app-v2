"use server";

import { multiTenantDb } from "@repo/database";
import type { Client } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";

/**
 * Validation Schemas
 */
const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  leadId: z.string().cuid().optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().cuid(),
});

const searchClientsSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Create a new client
 */
export async function createClient(data: z.infer<typeof createClientSchema>) {
  try {
    // Validate input
    const validatedData = createClientSchema.parse(data);

    // Get internal organization ID
    const { internalOrgId } = await getTenantContext();

    // Create client with tenant context
    const client = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.create({
        data: {
          ...validatedData,
          tenantId: internalOrgId,
        },
      });
    });

    revalidatePath("/clients");
    return { data: client };
  } catch (error) {
    console.error("Failed to create client:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to create client" };
  }
}

/**
 * Get all clients for the current organization
 */
export async function getClients(options?: {
  limit?: number;
  cursor?: string;
  offset?: number;
}) {
  try {
    const { internalOrgId } = await getTenantContext();

    const clients = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.findMany({
        where: {
          ...(options?.cursor && {
            id: { lt: options.cursor },
          }),
        },
        orderBy: { createdAt: "desc" },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      });
    });

    return { data: clients };
  } catch (error) {
    console.error("Failed to get clients:", error);
    return { error: "Failed to get clients" };
  }
}

/**
 * Get a single client by ID
 */
export async function getClient(id: string) {
  try {
    if (!id) {
      return { error: "Client ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    const client = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.findUnique({
        where: { id },
      });
    });

    if (!client) {
      return { error: "Client not found" };
    }

    return { data: client };
  } catch (error) {
    console.error("Failed to get client:", error);
    return { error: "Failed to get client" };
  }
}

/**
 * Update a client
 */
export async function updateClient(data: z.infer<typeof updateClientSchema>) {
  try {
    // Validate input
    const validatedData = updateClientSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const { internalOrgId } = await getTenantContext();

    // Update client with tenant context (RLS ensures we can only update our own clients)
    const client = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.update({
        where: { id },
        data: updateData,
      });
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { data: client };
  } catch (error) {
    console.error("Failed to update client:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to update client" };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string) {
  try {
    if (!id) {
      return { error: "Client ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    // Delete client with tenant context (RLS ensures we can only delete our own clients)
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.delete({
        where: { id },
      });
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete client:", error);
    return { error: "Failed to delete client" };
  }
}

/**
 * Search clients by name, email, company, etc.
 */
export async function searchClients(options: z.infer<typeof searchClientsSchema>) {
  try {
    const validatedOptions = searchClientsSchema.parse(options);
    const { internalOrgId } = await getTenantContext();

    const clients = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.findMany({
        where: {
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

    return { data: clients };
  } catch (error) {
    console.error("Failed to search clients:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid search parameters" };
    }
    
    return { error: "Failed to search clients" };
  }
}

/**
 * Get clients count
 */
export async function getClientsStats() {
  try {
    const { internalOrgId } = await getTenantContext();

    const stats = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      const total = await prisma.client.count();

      return {
        total,
      };
    });

    return { data: stats };
  } catch (error) {
    console.error("Failed to get clients stats:", error);
    return { error: "Failed to get clients stats" };
  }
}

/**
 * Convert a lead to a client
 */
export async function convertLeadToClient(leadId: string) {
  try {
    if (!leadId) {
      return { error: "Lead ID is required" };
    }

    const { internalOrgId } = await getTenantContext();

    // Get the lead first
    const lead = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.findUnique({
        where: { id: leadId },
      });
    });

    if (!lead) {
      return { error: "Lead not found" };
    }

    // Create client from lead data
    const client = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.client.create({
        data: {
          tenantId: internalOrgId,
          leadId: leadId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          address: lead.address,
          notes: lead.notes,
        },
      });
    });

    // Update lead status to CONVERTED
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONVERTED" },
      });
    });

    revalidatePath("/leads");
    revalidatePath("/clients");
    return { data: client };
  } catch (error) {
    console.error("Failed to convert lead to client:", error);
    return { error: "Failed to convert lead to client" };
  }
}
