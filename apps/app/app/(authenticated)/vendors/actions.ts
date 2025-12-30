"use server";

import { auth } from "@repo/auth/server";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getInternalOrgId } from "../lib/auth-helpers";

/**
 * Validation Schemas
 */
const createVendorSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  contactName: z.string().max(255).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  serviceIds: z.array(z.string().cuid()).optional(),
});

const updateVendorSchema = createVendorSchema.partial().extend({
  id: z.string().cuid(),
});

const searchVendorsSchema = z.object({
  query: z.string().optional(),
  serviceCategoryId: z.string().cuid().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Create a new vendor
 */
export async function createVendor(data: z.infer<typeof createVendorSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = createVendorSchema.parse(data);
    const { serviceIds, ...vendorData } = validatedData;

    // Get internal organization ID
    const internalOrgId = await getInternalOrgId(orgId);

    // Create vendor with tenant context and services
    const vendor = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.vendor.create({
        data: {
          ...vendorData,
          tenantId: internalOrgId,
          ...(serviceIds && serviceIds.length > 0 && {
            services: {
              create: serviceIds.map((serviceId) => ({
                tenantId: internalOrgId,
                serviceId,
              })),
            },
          }),
        },
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    revalidatePath("/vendors");
    return { data: vendor };
  } catch (error) {
    console.error("Failed to create vendor:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to create vendor" };
  }
}

/**
 * Get all vendors for the current organization
 */
export async function getVendors(options?: {
  limit?: number;
  cursor?: string;
  offset?: number;
  serviceCategoryId?: string;
}) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const vendors = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.vendor.findMany({
        where: {
          ...(options?.cursor && {
            id: { lt: options.cursor },
          }),
          ...(options?.serviceCategoryId && {
            services: {
              some: {
                serviceId: options.serviceCategoryId,
              },
            },
          }),
        },
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      });
    });

    return { data: vendors };
  } catch (error) {
    console.error("Failed to get vendors:", error);
    return { error: "Failed to get vendors" };
  }
}

/**
 * Get a single vendor by ID
 */
export async function getVendor(id: string) {
  try {
    if (!id) {
      return { error: "Vendor ID is required" };
    }

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const vendor = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.vendor.findUnique({
        where: { id },
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    if (!vendor) {
      return { error: "Vendor not found" };
    }

    return { data: vendor };
  } catch (error) {
    console.error("Failed to get vendor:", error);
    return { error: "Failed to get vendor" };
  }
}

/**
 * Update a vendor
 */
export async function updateVendor(data: z.infer<typeof updateVendorSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    // Validate input
    const validatedData = updateVendorSchema.parse(data);
    const { id, serviceIds, ...updateData } = validatedData;

    const internalOrgId = await getInternalOrgId(orgId);

    // Update vendor with tenant context
    const vendor = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // If serviceIds are provided, update the services
      if (serviceIds !== undefined) {
        // Delete existing services
        await prisma.vendorServices.deleteMany({
          where: { vendorId: id },
        });

        // Create new services
        if (serviceIds.length > 0) {
          await prisma.vendorServices.createMany({
            data: serviceIds.map((serviceId) => ({
              tenantId: internalOrgId,
              vendorId: id,
              serviceId,
            })),
          });
        }
      }

      return prisma.vendor.update({
        where: { id },
        data: updateData,
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return { data: vendor };
  } catch (error) {
    console.error("Failed to update vendor:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }
    
    return { error: "Failed to update vendor" };
  }
}

/**
 * Delete a vendor
 */
export async function deleteVendor(id: string) {
  try {
    if (!id) {
      return { error: "Vendor ID is required" };
    }

    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    // Delete vendor with tenant context (cascade will delete vendor services)
    await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.vendor.delete({
        where: { id },
      });
    });

    revalidatePath("/vendors");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return { error: "Failed to delete vendor" };
  }
}

/**
 * Search vendors by company name, contact name, email, phone, address
 */
export async function searchVendors(options: z.infer<typeof searchVendorsSchema>) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Not authenticated" };
    }

    const validatedOptions = searchVendorsSchema.parse(options);
    const internalOrgId = await getInternalOrgId(orgId);

    const vendors = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      return prisma.vendor.findMany({
        where: {
          ...(validatedOptions.query && {
            OR: [
              { companyName: { contains: validatedOptions.query, mode: "insensitive" } },
              { contactName: { contains: validatedOptions.query, mode: "insensitive" } },
              { email: { contains: validatedOptions.query, mode: "insensitive" } },
              { phone: { contains: validatedOptions.query, mode: "insensitive" } },
              { address: { contains: validatedOptions.query, mode: "insensitive" } },
            ],
          }),
          ...(validatedOptions.serviceCategoryId && {
            services: {
              some: {
                serviceId: validatedOptions.serviceCategoryId,
              },
            },
          }),
          ...(validatedOptions.cursor && {
            id: { lt: validatedOptions.cursor },
          }),
        },
        include: {
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: validatedOptions.offset ?? 0,
        take: validatedOptions.limit,
      });
    });

    return { data: vendors };
  } catch (error) {
    console.error("Failed to search vendors:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid search parameters" };
    }
    
    return { error: "Failed to search vendors" };
  }
}
