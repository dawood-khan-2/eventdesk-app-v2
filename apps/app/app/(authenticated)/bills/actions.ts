"use server";

import { auth } from "@repo/auth/server";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getInternalOrgId } from "../lib/auth-helpers";
import {
  calculateBillWithPayments,
} from "@/lib/bill-calculations";
import { put, del } from "@repo/storage";

const createBillSchema = z.object({
  number: z.string().min(1, "Bill number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  serviceCategoryId: z.string().min(1, "Service category is required"),
  eventId: z.string().min(1, "Event is required"),
  billDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  attachmentUrl: z.string().optional(),
});

const updateBillSchema = z.object({
  id: z.string(),
  number: z.string().min(1, "Bill number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  serviceCategoryId: z.string().min(1, "Service category is required"),
  eventId: z.string().min(1, "Event is required"),
  billDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  attachmentUrl: z.string().optional(),
});

const recordPaymentSchema = z.object({
  id: z.string(),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentDate: z.string(),
  paymentModeId: z.string().min(1, "Payment mode is required"),
  referenceNumber: z.string().optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type RecordBillPaymentInput = z.infer<typeof recordPaymentSchema>;

export async function createBill(input: CreateBillInput) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const validated = createBillSchema.parse(input);
    const internalOrgId = await getInternalOrgId(orgId);

    // Check for duplicate bill number for the vendor
    const existingBill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findFirst({
        where: {
          vendorId: validated.vendorId,
          number: validated.number,
        },
      })
    );

    if (existingBill) {
      return { error: "Bill number already exists for this vendor" };
    }

    const bill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.create({
        data: {
          tenantId: internalOrgId,
          number: validated.number,
          vendorId: validated.vendorId,
          serviceCategoryId: validated.serviceCategoryId,
          eventId: validated.eventId,
          billDate: new Date(validated.billDate),
          dueDate: new Date(validated.dueDate),
          amount: validated.amount,
          attachmentUrl: validated.attachmentUrl,
        },
        include: {
          vendor: { select: { id: true, companyName: true, contactName: true, email: true } },
          serviceCategory: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      })
    );

    revalidatePath("/bills");

    return { data: calculateBillWithPayments(bill) };
  } catch (error) {
    console.error("Failed to create bill:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to create bill" };
  }
}

export async function getBills(
  page = 1,
  limit = 20,
  query = "",
  eventId?: string,
  status?: "UNPAID" | "PARTIALLY_PAID" | "PAID",
  startDate?: string,
  endDate?: string
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);
    const offset = (page - 1) * limit;

    const bills = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findMany({
        where: {
          tenantId: internalOrgId,
          ...(eventId && { eventId }), // Filter by eventId if provided
          ...(query && {
            OR: [
              { number: { contains: query, mode: "insensitive" } },
              { vendor: { companyName: { contains: query, mode: "insensitive" } } },
              { vendor: { contactName: { contains: query, mode: "insensitive" } } },
              { serviceCategory: { name: { contains: query, mode: "insensitive" } } },
            ],
          }),
          ...(startDate && endDate && {
            billDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        },
        include: {
          vendor: { select: { id: true, companyName: true, contactName: true, email: true } },
          serviceCategory: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      })
    );

    // Calculate payment information for each bill
    let billsWithPayments = bills.map(calculateBillWithPayments);

    // Filter by status if provided
    if (status) {
      billsWithPayments = billsWithPayments.filter((bill) => bill.status === status);
    }

    return { data: billsWithPayments };
  } catch (error) {
    console.error("Failed to get bills:", error);
    return { error: "Failed to get bills" };
  }
}

export async function getBill(id: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const bill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findUnique({
        where: { id },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          serviceCategory: { select: { id: true, name: true } },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              venue: true,
            },
          },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      })
    );

    if (!bill) {
      return { error: "Bill not found" };
    }

    return { data: calculateBillWithPayments(bill) };
  } catch (error) {
    console.error("Failed to get bill:", error);
    return { error: "Failed to get bill" };
  }
}

export async function updateBill(input: UpdateBillInput) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const validated = updateBillSchema.parse(input);
    const internalOrgId = await getInternalOrgId(orgId);

    // Check for duplicate bill number for the vendor (excluding current bill)
    const existingBill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findFirst({
        where: {
          vendorId: validated.vendorId,
          number: validated.number,
          id: { not: validated.id },
        },
      })
    );

    if (existingBill) {
      return { error: "Bill number already exists for this vendor" };
    }

    // If new attachment URL is provided, delete the old one
    if (validated.attachmentUrl) {
      const currentBill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
        prisma.bill.findUnique({
          where: { id: validated.id },
          select: { attachmentUrl: true },
        })
      );

      if (currentBill?.attachmentUrl) {
        try {
          await del(currentBill.attachmentUrl);
        } catch (error) {
          console.error("Failed to delete old attachment:", error);
          // Continue even if deletion fails
        }
      }
    }

    const bill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.update({
        where: { id: validated.id },
        data: {
          number: validated.number,
          vendorId: validated.vendorId,
          serviceCategoryId: validated.serviceCategoryId,
          eventId: validated.eventId,
          billDate: new Date(validated.billDate),
          dueDate: new Date(validated.dueDate),
          amount: validated.amount,
          attachmentUrl: validated.attachmentUrl,
        },
        include: {
          vendor: { select: { id: true, companyName: true, contactName: true, email: true } },
          serviceCategory: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      })
    );

    revalidatePath("/bills");

    return { data: calculateBillWithPayments(bill) };
  } catch (error) {
    console.error("Failed to update bill:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update bill" };
  }
}

export async function deleteBill(id: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    // Get bill to check for attachment
    const bill = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findUnique({
        where: { id },
        select: { attachmentUrl: true },
      })
    );

    // Delete the bill
    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.delete({
        where: { id },
      })
    );

    // Delete attachment from storage if exists
    if (bill?.attachmentUrl) {
      try {
        await del(bill.attachmentUrl);
      } catch (error) {
        console.error("Failed to delete attachment:", error);
        // Don't fail the operation if storage deletion fails
      }
    }

    revalidatePath("/bills");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete bill:", error);
    return { error: "Failed to delete bill" };
  }
}

export async function searchBills(query: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const bills = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.bill.findMany({
        where: {
          tenantId: internalOrgId,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { vendor: { companyName: { contains: query, mode: "insensitive" } } },
            { vendor: { contactName: { contains: query, mode: "insensitive" } } },
            { serviceCategory: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          vendor: { select: { id: true, companyName: true, contactName: true, email: true } },
          serviceCategory: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    );

    return { data: bills.map(calculateBillWithPayments) };
  } catch (error) {
    console.error("Failed to search bills:", error);
    return { error: "Failed to search bills" };
  }
}

export async function getBillsStats() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const stats = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Fetch all bills with payment records
      const bills = await prisma.bill.findMany({
        include: {
          paymentRecords: true,
        },
      });

      // Calculate stats from all bills
      const total = bills.length;
      let unpaid = 0;
      let partiallyPaid = 0;
      let paid = 0;

      for (const bill of bills) {
        const billWithPayments = calculateBillWithPayments(bill);

        switch (billWithPayments.status) {
          case "UNPAID":
            unpaid++;
            break;
          case "PARTIALLY_PAID":
            partiallyPaid++;
            break;
          case "PAID":
            paid++;
            break;
        }
      }

      return { total, unpaid, partiallyPaid, paid };
    });

    return { data: stats };
  } catch (error) {
    console.error("Failed to get bills stats:", error);
    return { error: "Failed to get bills stats" };
  }
}

/**
 * Record a payment for a bill
 */
export async function recordBillPayment(input: RecordBillPaymentInput) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const validated = recordPaymentSchema.parse(input);
    const internalOrgId = await getInternalOrgId(orgId);

    const result = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Create payment record
      await prisma.paymentRecord.create({
        data: {
          tenantId: internalOrgId,
          billId: validated.id,
          amount: validated.amount,
          paymentDate: new Date(validated.paymentDate),
          paymentModeId: validated.paymentModeId,
          referenceNumber: validated.referenceNumber,
        },
      });

      // Fetch updated bill with all payment records
      const bill = await prisma.bill.findUnique({
        where: { id: validated.id },
        include: {
          vendor: { select: { id: true, companyName: true, contactName: true, email: true } },
          serviceCategory: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      });

      if (!bill) {
        throw new Error("Bill not found");
      }

      return bill;
    });

    revalidatePath("/bills");

    return { data: calculateBillWithPayments(result) };
  } catch (error) {
    console.error("Failed to record payment:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to record payment" };
  }
}

/**
 * Get payment records for a bill
 */
export async function getBillPayments(billId: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    const payments = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentRecord.findMany({
        where: { billId },
        include: {
          paymentMode: { select: { id: true, name: true } },
        },
        orderBy: { paymentDate: "desc" },
      })
    );

    return { data: payments };
  } catch (error) {
    console.error("Failed to get bill payments:", error);
    return { error: "Failed to get bill payments" };
  }
}

/**
 * Delete a payment record
 */
export async function deleteBillPayment(paymentId: string, billId: string) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const internalOrgId = await getInternalOrgId(orgId);

    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.paymentRecord.delete({
        where: { id: paymentId },
      })
    );

    revalidatePath("/bills");

    // Return updated bill with payments
    return getBill(billId);
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return { error: "Failed to delete payment" };
  }
}

/**
 * Upload a bill attachment file
 * Validates file type and size (max 4.5MB for server uploads)
 */
export async function uploadBillAttachment(formData: FormData) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
      return { error: "No file provided" };
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type. Only PDF, PNG, and JPEG files are allowed." };
    }

    // Validate file size (4.5MB = 4.5 * 1024 * 1024 bytes)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size exceeds 4.5MB limit" };
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `bills/${orgId}/${timestamp}.${fileExt}`;

    // Upload to Vercel Blob storage
    const blob = await put(fileName, file, {
      access: "public",
    });

    return { 
      data: { 
        url: blob.url, 
        fileName: file.name,
        size: file.size 
      } 
    };
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return { error: "Failed to upload attachment" };
  }
}
