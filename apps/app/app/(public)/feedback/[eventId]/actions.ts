"use server";

import { jwtVerify } from "jose";
import { env } from "@/env";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";

type TokenPayload = {
  eventId: string;
  tenantId: string;
  iat: number;
  exp: number;
};

/**
 * Validate JWT token and fetch event details
 */
export async function validateFeedbackToken(token: string, eventId: string) {
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
          rating: true,
          comments: true,
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

    // Check if feedback already submitted
    if (event.rating !== null) {
      return { error: "Feedback has already been submitted for this event" };
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

/**
 * Submit feedback for an event
 */
export async function submitFeedback(
  token: string,
  eventId: string,
  rating: number,
  comments: string
) {
  try {
    // Validate token first
    const validationResult = await validateFeedbackToken(token, eventId);
    
    if (validationResult.error || !validationResult.data) {
      return { error: validationResult.error || "Invalid token" };
    }

    const { tenantId } = validationResult.data;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Update event with feedback
    await multiTenantDb.forTenant(tenantId).run((prisma) =>
      prisma.event.update({
        where: { id: eventId },
        data: {
          rating,
          comments: comments.trim() || null,
        },
      })
    );

    // Revalidate event page
    revalidatePath(`/events/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return { error: "Failed to submit feedback. Please try again." };
  }
}
