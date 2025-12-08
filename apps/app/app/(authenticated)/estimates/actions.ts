"use server";

import { auth } from "@repo/auth/server";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getInternalOrgId } from "../lib/auth-helpers";

// Line Item Schema
const lineItemSchema = z.object({
  id: z.string(),
  serviceCategoryId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().optional(),
  rate: z.number().min(0, "Rate must be positive"),
  tax: z.number().min(0, "Tax must be positive"),
});

const createEstimateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).default("DRAFT"),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  eventName: z.string().optional(),
  eventVenue: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).default([]),
  discount: z.number().min(0, "Discount must be positive").default(0),
});

const updateEstimateSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  eventName: z.string().optional(),
  eventVenue: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  lineItems: z.array(lineItemSchema),
  discount: z.number().min(0, "Discount must be positive"),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;

export async function createEstimate(input: CreateEstimateInput) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const validated = createEstimateSchema.parse(input);
    const internalOrgId = await getInternalOrgId(orgId);

    const estimate = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.create({
        data: {
          tenantId: internalOrgId,
          title: validated.title,
          status: validated.status as any,
          clientId: validated.clientId,
          leadId: validated.leadId,
          eventName: validated.eventName,
          eventVenue: validated.eventVenue,
          eventStartDate: validated.eventStartDate ? new Date(validated.eventStartDate) : null,
          eventEndDate: validated.eventEndDate ? new Date(validated.eventEndDate) : null,
          lineItems: validated.lineItems,
          discount: validated.discount,
        },
        include: {
          client: { select: { name: true } },
          lead: { select: { name: true } },
        },
      })
    );

    revalidatePath("/estimates");

    return { data: estimate };
  } catch (error) {
    console.error("Failed to create estimate:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to create estimate" };
  }
}

export async function getEstimates(page = 1, limit = 20, query = "") {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);
    const offset = (page - 1) * limit;

    const estimates = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.findMany({
        where: {
          tenantId: internalOrgId,
          ...(query && {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { eventName: { contains: query, mode: "insensitive" } },
              { eventVenue: { contains: query, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          client: { select: { name: true } },
          lead: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      })
    );

    return { data: estimates };
  } catch (error) {
    console.error("Failed to get estimates:", error);
    return { error: "Failed to get estimates" };
  }
}

export async function getEstimate(id: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const estimate = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true, email: true } },
        },
      })
    );

    if (!estimate) {
      return { error: "Estimate not found" };
    }

    return { data: estimate };
  } catch (error) {
    console.error("Failed to get estimate:", error);
    return { error: "Failed to get estimate" };
  }
}

export async function updateEstimate(input: UpdateEstimateInput) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const validated = updateEstimateSchema.parse(input);
    const internalOrgId = await getInternalOrgId(orgId);

    const estimate = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.update({
        where: { id: validated.id },
        data: {
          title: validated.title,
          status: validated.status as any,
          clientId: validated.clientId,
          leadId: validated.leadId,
          eventName: validated.eventName,
          eventVenue: validated.eventVenue,
          eventStartDate: validated.eventStartDate ? new Date(validated.eventStartDate) : null,
          eventEndDate: validated.eventEndDate ? new Date(validated.eventEndDate) : null,
          lineItems: validated.lineItems,
          discount: validated.discount,
        },
        include: {
          client: { select: { name: true } },
          lead: { select: { name: true } },
        },
      })
    );

    revalidatePath("/estimates");

    return { data: estimate };
  } catch (error) {
    console.error("Failed to update estimate:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update estimate" };
  }
}

export async function deleteEstimate(id: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.delete({
        where: { id },
      })
    );

    revalidatePath("/estimates");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete estimate:", error);
    return { error: "Failed to delete estimate" };
  }
}

export async function searchEstimates(query: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const estimates = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.findMany({
        where: {
          tenantId: internalOrgId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { eventName: { contains: query, mode: "insensitive" } },
            { eventVenue: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          client: { select: { name: true } },
          lead: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    );

    return { data: estimates };
  } catch (error) {
    console.error("Failed to search estimates:", error);
    return { error: "Failed to search estimates" };
  }
}

export async function getEstimatesStats() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const count = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.count({
        where: { tenantId: internalOrgId },
      })
    );

    return { data: { total: count } };
  } catch (error) {
    console.error("Failed to get estimates stats:", error);
    return { error: "Failed to get estimates stats" };
  }
}

// Helper function to get service categories for line items
export async function getServiceCategories() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const categories = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.serviceCategories.findMany({
        where: { tenantId: internalOrgId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    );

    return { data: categories };
  } catch (error) {
    console.error("Failed to get service categories:", error);
    return { error: "Failed to get service categories" };
  }
}