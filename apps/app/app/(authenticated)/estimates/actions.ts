"use server";

import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";
import { SignJWT } from "jose";
import { env } from "@/env";
import { resend } from "@repo/email";
import { EstimateApprovalTemplate } from "@repo/email/templates/estimate-approval";
import { render } from "@react-email/components";
import { getFinanceSettings } from "../settings/actions";

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
  eventId: z.string().optional(),
  eventName: z.string().optional(),
  eventVenue: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  expiryDate: z.string().optional(),
  statusChangedAt: z.string().optional(),
  lineItems: z.array(lineItemSchema).default([]),
  discount: z.number().min(0, "Discount must be positive").default(0),
});

const updateEstimateSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  eventName: z.string().optional(),
  eventVenue: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  expiryDate: z.string().optional(),
  lineItems: z.array(lineItemSchema),
  discount: z.number().min(0, "Discount must be positive"),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;

export async function createEstimate(input: CreateEstimateInput) {
  try {
    const validated = createEstimateSchema.parse(input);
    const { internalOrgId } = await getTenantContext();

    const estimate = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.create({
        data: {
          tenantId: internalOrgId,
          title: validated.title,
          status: validated.status as any,
          statusChangedAt: new Date(),
          clientId: validated.clientId,
          leadId: validated.leadId,
          eventId: validated.eventId,
          eventName: validated.eventName,
          eventVenue: validated.eventVenue,
          eventStartDate: validated.eventStartDate ? new Date(validated.eventStartDate) : null,
          eventEndDate: validated.eventEndDate ? new Date(validated.eventEndDate) : null,
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
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

export async function getEstimates(page = 1, limit = 20, query = "", eventId?: string) {
  try {
    const { internalOrgId } = await getTenantContext();
    const offset = (page - 1) * limit;

    const estimates = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.findMany({
        where: {
          tenantId: internalOrgId,
          ...(eventId && { eventId }), // Filter by eventId if provided
          ...(query && {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { eventName: { contains: query, mode: "insensitive" } },
              { eventVenue: { contains: query, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          client: { select: { name: true, email: true } },
          lead: { select: { name: true, email: true } },
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
    const { internalOrgId } = await getTenantContext();

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
    const validated = updateEstimateSchema.parse(input);
    const { internalOrgId } = await getTenantContext();

    const estimate = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.update({
        where: { id: validated.id },
        data: {
          title: validated.title,
          clientId: validated.clientId,
          leadId: validated.leadId,
          eventName: validated.eventName,
          eventVenue: validated.eventVenue,
          eventStartDate: validated.eventStartDate ? new Date(validated.eventStartDate) : null,
          eventEndDate: validated.eventEndDate ? new Date(validated.eventEndDate) : null,
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
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
    const { internalOrgId } = await getTenantContext();

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
    const { internalOrgId } = await getTenantContext();

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
    const { internalOrgId } = await getTenantContext();

    const count = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.estimate.count()
    );

    return { data: { total: count } };
  } catch (error) {
    console.error("Failed to get estimates stats:", error);
    return { error: "Failed to get estimates stats" };
  }
}

/**
 * Helper function to update estimate status and automatically update statusChangedAt
 */
export async function updateEstimateStatus(
  estimateId: string,
  newStatus: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED"
) {
  try {
    const { internalOrgId } = await getTenantContext();

    const estimate = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      const updated = await prisma.estimate.update({
        where: { id: estimateId },
        data: {
          status: newStatus as any,
          statusChangedAt: new Date(),
        },
        include: {
          client: { select: { name: true, email: true } },
          lead: { select: { name: true, email: true } },
        },
      });

      // If status changed to SENT and estimate has a lead, update lead status to PROPOSAL_SENT
      if (newStatus === "SENT" && updated.leadId) {
        await prisma.lead.update({
          where: { id: updated.leadId },
          data: { status: "PROPOSAL_SENT" }
        });
      }

      return updated;
    });

    revalidatePath("/estimates");

    return { data: estimate };
  } catch (error) {
    console.error("Failed to update estimate status:", error);
    return { error: "Failed to update estimate status" };
  }
}

// Generate JWT token for estimate approval
export async function generateEstimateToken(estimateId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Create JWT token with estimateId and tenantId
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({ 
      estimateId, 
      tenantId: internalOrgId 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("48h") // Token expires in 48 hours
      .sign(secret);

    return { data: token };
  } catch (error) {
    console.error("Failed to generate estimate token:", error);
    return { error: "Failed to generate token" };
  }
}

// Send estimate email
export async function sendEstimateEmail(estimateId: string) {
  try {
    // Get estimate using existing function
    const estimateResult = await getEstimate(estimateId);
    if (estimateResult.error || !estimateResult.data) {
      return { error: estimateResult.error || "Estimate not found" };
    }

    const estimate = estimateResult.data;
    const clientEmail = estimate.client?.email || estimate.lead?.email;
    const clientName = estimate.client?.name || estimate.lead?.name;

    if (!clientEmail) {
      return { error: "No email address found for client or lead" };
    }

    if (!clientName) {
      return { error: "No name found for client or lead" };
    }

    // Generate JWT token
    const tokenResult = await generateEstimateToken(estimateId);
    if (tokenResult.error) {
      return { error: tokenResult.error };
    }

    // Construct URL
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewUrl = `${appUrl}/estimate/${estimateId}?token=${tokenResult.data}`;

    // Get currency code from settings
    const settingsResult = await getFinanceSettings();
    const currencyCode = settingsResult.data?.currencyCode || "USD";

    // Calculate totals
    const lineItems = (estimate.lineItems as any[]) || [];
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const discount = estimate.discount || 0;
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemAfterDiscount = subtotal === 0 ? 0 : itemSubtotal * (subtotalAfterDiscount / subtotal);
      return sum + (itemAfterDiscount * (item.tax / 100));
    }, 0);
    const total = subtotalAfterDiscount + tax;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);

    // Send email
    const emailHtml = await render(
      EstimateApprovalTemplate({
        clientName,
        estimateTitle: estimate.title,
        eventName: estimate.eventName || undefined,
        viewUrl,
        subtotal: formatCurrency(subtotal),
        total: formatCurrency(total),
      })
    );

    await resend.emails.send({
      from: `EventDesk <${env.RESEND_FROM}>`,
      to: clientEmail,
      subject: `New Estimate: ${estimate.title}`,
      html: emailHtml,
    });

    // Update estimate status using existing function (also updates lead status)
    const updateResult = await updateEstimateStatus(estimateId, "SENT");
    if (updateResult.error) {
      return { error: updateResult.error };
    }

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to send estimate email:", error);
    return { error: "Failed to send estimate email" };
  }
}