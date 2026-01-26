"use server";

import { database, multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";

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
