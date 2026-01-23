"use server";

import { jwtVerify } from "jose";
import { env } from "@/env";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type TokenPayload = {
  eventId: string;
  tenantId: string;
  iat: number;
  exp: number;
};

/**
 * Validate JWT token and fetch event details
 */
export async function validateRegistrationToken(token: string, eventId: string) {
  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: TokenPayload };

    // Validate eventId matches token
    if (payload.eventId !== eventId) {
      return { error: "Invalid token for this event" };
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { error: "Token has expired" };
    }

    // Fetch event using tenantId from token
    const event = await multiTenantDb.forTenant(payload.tenantId).run((prisma) =>
      prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          venue: true,
          startDate: true,
          endDate: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    );

    if (!event) {
      return { error: "Event not found" };
    }

    // Check if event is in the past
    const now_date = new Date();
    if (event.endDate < now_date) {
      return { error: "Registration is closed for this event" };
    }

    return { 
      data: {
        event,
        tenantId: payload.tenantId,
      }
    };
  } catch (error) {
    console.error("Token validation failed:", error);
    return { error: "Invalid or expired token" };
  }
}

// Guest registration schema
const guestRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "Either email or phone is required",
    path: ["email"],
  }
);

/**
 * Register a guest for an event
 */
export async function registerGuest(
  token: string,
  eventId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
  }
) {
  try {
    // Validate token first
    const validationResult = await validateRegistrationToken(token, eventId);
    
    if (validationResult.error || !validationResult.data) {
      return { error: validationResult.error || "Invalid token" };
    }

    const { tenantId } = validationResult.data;

    // Validate input
    const validatedData = guestRegistrationSchema.parse(data);

    // Create guest registration
    const guest = await multiTenantDb.forTenant(tenantId).run((prisma) =>
      prisma.guests.create({
        data: {
          tenantId,
          eventId,
          name: validatedData.name,
          email: validatedData.email || "",
          phone: validatedData.phone || null,
        },
      })
    );

    revalidatePath(`/events/${eventId}`);

    return { data: { success: true, guestId: guest.id } };
  } catch (error) {
    console.error("Failed to register guest:", error);
    
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "Invalid input" };
    }

    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: "Failed to register. Please try again." };
  }
}
