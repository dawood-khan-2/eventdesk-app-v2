"use server";

import { multiTenantDb, database } from "@repo/database";
import { jwtVerify } from "jose";
import { env } from "@/env";

type TokenPayload = {
  invoiceId: string;
  tenantId: string;
  iat?: number;
  exp?: number;
};

export async function validateInvoiceToken(token: string, invoiceId: string) {
  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const tokenPayload = payload as unknown as TokenPayload;

    // Verify the token is for this invoice
    if (tokenPayload.invoiceId !== invoiceId) {
      return { error: "Invalid token for this invoice" };
    }

    // Fetch the invoice with full details using the tenantId from the token
    const invoice = await multiTenantDb.forTenant(tokenPayload.tenantId).run(async (prisma) => {
      return prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              venue: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
    });

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    // Get organization details for the invoice header
    const organization = await database.organization.findUnique({
      where: { id: tokenPayload.tenantId },
      select: {
        name: true,
        imageUrl: true,
        address: true,
        phone: true,
        currencyCode: true,
      },
    });

    return {
      invoice,
      organization,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("exp")) {
        return { error: "This invoice link has expired" };
      }
    }
    return { error: "Invalid or expired token" };
  }
}
