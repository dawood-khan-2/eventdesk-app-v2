"use server";

import { database, multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";
import { auth, clerkClient } from "@repo/auth/server";
import { stripe } from "@repo/payments";
import { env } from "@/env";

const updateOrganizationSettingsSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateFinanceSettingsSchema = z.object({
  currencyCode: z.string().length(3), // ISO 4217 3-letter code
});

const createServiceCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

const updateServiceCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

export type UpdateOrganizationSettingsInput = z.infer<
  typeof updateOrganizationSettingsSchema
>;

export type UpdateFinanceSettingsInput = z.infer<
  typeof updateFinanceSettingsSchema
>;

export type CreateServiceCategoryInput = z.infer<
  typeof createServiceCategorySchema
>;

export type UpdateServiceCategoryInput = z.infer<
  typeof updateServiceCategorySchema
>;

export async function getOrganizationSettings() {
  try {
    const { internalOrgId } = await getTenantContext();

    const organization = await database.organization.findUnique({
      where: { id: internalOrgId },
      select: {
        address: true,
        phone: true,
      },
    });

    if (!organization) {
      return { error: "Organization not found" };
    }

    return { data: organization };
  } catch (error) {
    console.error("Failed to get organization settings:", error);
    return { error: "Failed to get organization settings" };
  }
}

export async function updateOrganizationSettings(
  input: UpdateOrganizationSettingsInput
) {
  try {
    const validated = updateOrganizationSettingsSchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    await database.organization.update({
      where: { id: internalOrgId },
      data: {
        address: validated.address,
        phone: validated.phone,
      },
    });

    revalidatePath("/settings");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to update organization settings:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update organization settings" };
  }
}

export async function getFinanceSettings() {
  try {
    const { internalOrgId } = await getTenantContext();

    const organization = await database.organization.findUnique({
      where: { id: internalOrgId },
      select: {
        currencyCode: true,
      },
    });

    if (!organization) {
      return { error: "Organization not found" };
    }

    return { data: organization };
  } catch (error) {
    console.error("Failed to get finance settings:", error);
    return { error: "Failed to get finance settings" };
  }
}

export async function updateFinanceSettings(
  input: UpdateFinanceSettingsInput
) {
  try {
    const validated = updateFinanceSettingsSchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    await database.organization.update({
      where: { id: internalOrgId },
      data: {
        currencyCode: validated.currencyCode,
      },
    });

    revalidatePath("/settings");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to update finance settings:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update finance settings" };
  }
}

// ServiceCategories actions
export async function getServiceCategories() {
  try {
    const { internalOrgId } = await getTenantContext();

    const categories = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.serviceCategories.findMany({
        orderBy: { name: "asc" },
      })
    );

    return { data: categories };
  } catch (error) {
    console.error("Failed to get service categories:", error);
    return { error: "Failed to get service categories" };
  }
}

export async function createServiceCategory(input: CreateServiceCategoryInput) {
  try {
    const validated = createServiceCategorySchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    const category = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.serviceCategories.create({
        data: {
          tenantId: internalOrgId,
          name: validated.name,
        },
      })
    );

    revalidatePath("/settings");

    return { data: category };
  } catch (error) {
    console.error("Failed to create service category:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to create service category" };
  }
}

export async function updateServiceCategory(input: UpdateServiceCategoryInput) {
  try {
    const validated = updateServiceCategorySchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    const category = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.serviceCategories.update({
        where: { id: validated.id },
        data: { name: validated.name },
      })
    );

    revalidatePath("/settings");

    return { data: category };
  } catch (error) {
    console.error("Failed to update service category:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update service category" };
  }
}

export async function deleteServiceCategory(id: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.serviceCategories.delete({
        where: { id },
      })
    );

    revalidatePath("/settings");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete service category:", error);
    return { error: "Failed to delete service category" };
  }
}

// PaymentModes actions
const createPaymentModeSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const updatePaymentModeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
});

export type CreatePaymentModeInput = z.infer<typeof createPaymentModeSchema>;
export type UpdatePaymentModeInput = z.infer<typeof updatePaymentModeSchema>;

export async function getPaymentModes() {
  try {
    const { internalOrgId } = await getTenantContext();

    const paymentModes = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentModes.findMany({
        orderBy: { name: "asc" },
      })
    );

    return { data: paymentModes };
  } catch (error) {
    console.error("Failed to get payment modes:", error);
    return { error: "Failed to get payment modes" };
  }
}

export async function createPaymentMode(input: CreatePaymentModeInput) {
  try {
    const validated = createPaymentModeSchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    const paymentMode = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentModes.create({
        data: {
          tenantId: internalOrgId,
          name: validated.name,
        },
      })
    );

    revalidatePath("/settings");

    return { data: paymentMode };
  } catch (error) {
    console.error("Failed to create payment mode:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to create payment mode" };
  }
}

export async function updatePaymentMode(input: UpdatePaymentModeInput) {
  try {
    const validated = updatePaymentModeSchema.parse(input);
    
    const { internalOrgId } = await getTenantContext();

    const paymentMode = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentModes.update({
        where: { id: validated.id },
        data: { name: validated.name },
      })
    );

    revalidatePath("/settings");

    return { data: paymentMode };
  } catch (error) {
    console.error("Failed to update payment mode:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update payment mode" };
  }
}

export async function deletePaymentMode(id: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentModes.delete({
        where: { id },
      })
    );

    revalidatePath("/settings");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete payment mode:", error);
    return { error: "Failed to delete payment mode" };
  }
}

// Team invitation actions
const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

export async function inviteTeamMember(input: InviteTeamMemberInput) {
  try {
    const validated = inviteTeamMemberSchema.parse(input);
    
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "No organization found" };
    }

    const client = await clerkClient();
    
    // Create organization invitation with org:member role
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: validated.email,
      role: "org:member",
    });

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to invite team member:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid email address" };
    }

    return { error: "Failed to send invitation" };
  }
}

export async function getTeamMembers() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "No organization found" };
    }

    const client = await clerkClient();
    
    // Get organization memberships
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Transform to simpler format and filter to only show org:member role
    const members = memberships.data
      .filter((membership) => membership.role === "org:member")
      .map((membership) => ({
        id: membership.id,
        userId: membership.publicUserData?.userId ?? "",
        name: `${membership.publicUserData?.firstName ?? ""} ${membership.publicUserData?.lastName ?? ""}`.trim() || "Unknown",
        email: membership.publicUserData?.identifier ?? "",
        role: membership.role,
      }));

    return { data: members };
  } catch (error) {
    console.error("Failed to get team members:", error);
    return { error: "Failed to get team members" };
  }
}

export async function removeTeamMember(userId: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "No organization found" };
    }

    const client = await clerkClient();
    
    // Remove user from organization
    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId,
    });

    revalidatePath("/settings");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return { error: "Failed to remove team member" };
  }
}

// Stripe Embedded Checkout actions
const createEmbeddedSessionSchema = z.object({
  priceId: z.string().startsWith("price_"),
  quantity: z.number().min(1).default(1),
});

export type CreateEmbeddedSessionInput = z.infer<typeof createEmbeddedSessionSchema>;

export async function createEmbeddedCheckoutSession(input: CreateEmbeddedSessionInput) {
  try {
    const validated = createEmbeddedSessionSchema.parse(input);

    const { internalOrgId } = await getTenantContext();

    const appUrl = env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "subscription",
      line_items: [
        {
          price: validated.priceId,
          quantity: validated.quantity,
        },
      ],
      // helpful to map later
      client_reference_id: internalOrgId,
      redirect_on_completion: "always",
      return_url: `${appUrl}/settings?tab=subscription&status=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      return { error: "Failed to create checkout session" };
    }

    return { data: { clientSecret: session.client_secret } };
  } catch (error) {
    console.error("Failed to create embedded checkout session:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }
    return { error: "Failed to create embedded checkout session" };
  }
}

export async function validateCheckoutSession(sessionId: string) {
  try {
    if (!sessionId?.startsWith("cs_")) {
      return { error: "Invalid session id" };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      data: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        subscription: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        customer: typeof session.customer === "string" ? session.customer : session.customer?.id,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    };
  } catch (error) {
    console.error("Failed to validate checkout session:", error);
    return { error: "Failed to validate checkout session" };
  }
}
