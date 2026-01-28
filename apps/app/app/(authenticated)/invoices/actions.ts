"use server";

import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantContext } from "../lib/auth-helpers";
import { SignJWT } from "jose";
import { env } from "@/env";
import { resend } from "@repo/email";
import { InvoiceViewTemplate } from "@repo/email/templates/invoice-view";
import { render } from "@react-email/components";
import { getFinanceSettings } from "../settings/actions";
import {
  calculateInvoiceTotals,
  calculatePaymentStatus,
  calculateInvoiceWithPayments,
} from "@/lib/invoice-calculations";

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

const createInvoiceSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  eventId: z.string().min(1, "Event is required"),
  billTo: z.string().min(1, "Bill to address is required"),
  shipTo: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  poNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  discount: z.number().min(0, "Discount must be positive").default(0),
});

const updateInvoiceSchema = z.object({
  id: z.string(),
  number: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  eventId: z.string().min(1, "Event is required"),
  billTo: z.string().min(1, "Bill to address is required"),
  shipTo: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  poNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  discount: z.number().min(0, "Discount must be positive"),
});

const recordPaymentSchema = z.object({
  id: z.string(),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentDate: z.string(),
  paymentModeId: z.string().min(1, "Payment mode is required"),
  referenceNumber: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const validated = createInvoiceSchema.parse(input);
    const { internalOrgId } = await getTenantContext();

    const invoice = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.create({
        data: {
          tenantId: internalOrgId,
          number: validated.number,
          clientId: validated.clientId,
          eventId: validated.eventId,
          billTo: validated.billTo,
          shipTo: validated.shipTo,
          invoiceDate: validated.invoiceDate ? new Date(validated.invoiceDate) : new Date(),
          dueDate: new Date(validated.dueDate),
          poNumber: validated.poNumber,
          paymentTerms: validated.paymentTerms,
          notes: validated.notes,
          terms: validated.terms,
          lineItems: validated.lineItems,
          discount: validated.discount,
        },
        include: {
          client: { select: { name: true, email: true } },
          event: { select: { name: true } },
          paymentRecords: true,
        },
      })
    );

    revalidatePath("/invoices");

    return { data: calculateInvoiceWithPayments(invoice) };
  } catch (error) {
    console.error("Failed to create invoice:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to create invoice" };
  }
}

export async function getInvoices(page = 1, limit = 20, query = "", eventId?: string) {
  try {
    const { internalOrgId } = await getTenantContext();
    const offset = (page - 1) * limit;

    const invoices = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.findMany({
        where: {
          tenantId: internalOrgId,
          ...(eventId && { eventId }), // Filter by eventId if provided
          ...(query && {
            OR: [
              { number: { contains: query, mode: "insensitive" } },
              { poNumber: { contains: query, mode: "insensitive" } },
              { client: { name: { contains: query, mode: "insensitive" } } },
              { event: { name: { contains: query, mode: "insensitive" } } },
            ],
          }),
        },
        include: {
          client: { select: { name: true, email: true } },
          event: { select: { name: true } },
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

    // Calculate payment information for each invoice
    const invoicesWithPayments = invoices.map(calculateInvoiceWithPayments);

    return { data: invoicesWithPayments };
  } catch (error) {
    console.error("Failed to get invoices:", error);
    return { error: "Failed to get invoices" };
  }
}

export async function getInvoice(id: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    const invoice = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, email: true, company: true, address: true } },
          event: { select: { id: true, name: true, startDate: true, endDate: true, venue: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      })
    );

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    return { data: calculateInvoiceWithPayments(invoice) };
  } catch (error) {
    console.error("Failed to get invoice:", error);
    return { error: "Failed to get invoice" };
  }
}

export async function updateInvoice(input: UpdateInvoiceInput) {
  try {
    const validated = updateInvoiceSchema.parse(input);
    const { internalOrgId } = await getTenantContext();

    const invoice = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.update({
        where: { id: validated.id },
        data: {
          number: validated.number,
          clientId: validated.clientId,
          eventId: validated.eventId,
          billTo: validated.billTo,
          shipTo: validated.shipTo,
          invoiceDate: validated.invoiceDate ? new Date(validated.invoiceDate) : undefined,
          dueDate: new Date(validated.dueDate),
          poNumber: validated.poNumber,
          paymentTerms: validated.paymentTerms,
          notes: validated.notes,
          terms: validated.terms,
          lineItems: validated.lineItems,
          discount: validated.discount,
        },
        include: {
          client: { select: { name: true, email: true } },
          event: { select: { name: true } },
          paymentRecords: true,
        },
      })
    );

    revalidatePath("/invoices");

    return { data: calculateInvoiceWithPayments(invoice) };
  } catch (error) {
    console.error("Failed to update invoice:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to update invoice" };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.delete({
        where: { id },
      })
    );

    revalidatePath("/invoices");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return { error: "Failed to delete invoice" };
  }
}

export async function searchInvoices(query: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    const invoices = await multiTenantDb.forTenant(internalOrgId).run((prisma) =>
      prisma.invoice.findMany({
        where: {
          tenantId: internalOrgId,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { poNumber: { contains: query, mode: "insensitive" } },
            { client: { name: { contains: query, mode: "insensitive" } } },
            { event: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          client: { select: { name: true, email: true } },
          event: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    );

    return { data: invoices };
  } catch (error) {
    console.error("Failed to search invoices:", error);
    return { error: "Failed to search invoices" };
  }
}

export async function getInvoicesStats() {
  try {
    const { internalOrgId } = await getTenantContext();

    const stats = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Fetch all invoices with payment records
      const invoices = await prisma.invoice.findMany({
        include: {
          paymentRecords: true,
        },
      });

      // Calculate stats from all invoices
      const total = invoices.length;
      let unpaid = 0;
      let partiallyPaid = 0;
      let paid = 0;

      for (const invoice of invoices) {
        const invoiceWithPayments = calculateInvoiceWithPayments(invoice);
        
        switch (invoiceWithPayments.status) {
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
    console.error("Failed to get invoices stats:", error);
    return { error: "Failed to get invoices stats" };
  }
}

/**
 * Record a payment for an invoice and automatically update status
 */
export async function recordPayment(input: RecordPaymentInput) {
  try {
    const validated = recordPaymentSchema.parse(input);
    const { internalOrgId } = await getTenantContext();

    const result = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
      // Create payment record
      await prisma.paymentRecord.create({
        data: {
          tenantId: internalOrgId,
          invoiceId: validated.id,
          amount: validated.amount,
          paymentDate: new Date(validated.paymentDate),
          paymentModeId: validated.paymentModeId,
          referenceNumber: validated.referenceNumber,
        },
      });

      // Fetch updated invoice with all payment records
      const invoice = await prisma.invoice.findUnique({
        where: { id: validated.id },
        include: {
          client: { select: { name: true, email: true } },
          event: { select: { name: true } },
          paymentRecords: {
            include: {
              paymentMode: { select: { name: true } },
            },
            orderBy: { paymentDate: "desc" },
          },
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return invoice;
    });

    revalidatePath("/invoices");

    return { data: calculateInvoiceWithPayments(result) };
  } catch (error) {
    console.error("Failed to record payment:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid input" };
    }

    return { error: "Failed to record payment" };
  }
}

/**
 * Generate JWT token for invoice viewing
 */
export async function generateInvoiceToken(invoiceId: string) {
  try {
    const { internalOrgId } = await getTenantContext();

    // Create JWT token with invoiceId and tenantId
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new SignJWT({
      invoiceId,
      tenantId: internalOrgId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("90d") // Token expires in 90 days
      .sign(secret);

    return { data: token };
  } catch (error) {
    console.error("Failed to generate invoice token:", error);
    return { error: "Failed to generate token" };
  }
}

/**
 * Send invoice email with viewing link
 */
export async function sendInvoiceEmail(invoiceId: string) {
  try {
    // Get invoice using existing function
    const invoiceResult = await getInvoice(invoiceId);
    if (invoiceResult.error || !invoiceResult.data) {
      return { error: invoiceResult.error || "Invoice not found" };
    }

    const invoice = invoiceResult.data;
    const clientEmail = invoice.client?.email;
    const clientName = invoice.client?.name;

    if (!clientEmail) {
      return { error: "No email address found for client" };
    }

    if (!clientName) {
      return { error: "No name found for client" };
    }

    // Generate JWT token
    const tokenResult = await generateInvoiceToken(invoiceId);
    if (tokenResult.error) {
      return { error: tokenResult.error };
    }

    // Construct URL
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewUrl = `${appUrl}/invoice/${invoiceId}?token=${tokenResult.data}`;

    // Get currency code from settings
    const settingsResult = await getFinanceSettings();
    const currencyCode = settingsResult.data?.currencyCode || "USD";

    // Calculate totals
    const { total } = calculateInvoiceTotals(
      invoice.lineItems as any[],
      invoice.discount
    );

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);

    // Render email template
    const emailHtml = await render(
      InvoiceViewTemplate({
        clientName,
        invoiceNumber: invoice.number,
        eventName: invoice.event?.name,
        viewUrl,
        total: formatCurrency(total),
        dueDate: new Date(invoice.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        balanceDue: formatCurrency(invoice.balanceDue), // Now calculated by getInvoice
      })
    );

    await resend.emails.send({
      from: `EventDesk <${env.RESEND_FROM}>`,
      to: clientEmail,
      subject: `Invoice ${invoice.number}`,
      html: emailHtml,
    });

    revalidatePath("/invoices");

    return { data: { success: true } };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return { error: "Failed to send invoice email" };
  }
}
