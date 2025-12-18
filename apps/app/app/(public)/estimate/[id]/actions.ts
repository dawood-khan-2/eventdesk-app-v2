"use server";

import { jwtVerify } from "jose";
import { env } from "@/env";
import { multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";

type TokenPayload = {
  estimateId: string;
  tenantId: string;
  iat: number;
  exp: number;
};

/**
 * Validate JWT token and fetch estimate details
 */
export async function validateEstimateToken(token: string, estimateId: string) {
  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: TokenPayload };

    // Validate estimateId matches token
    if (payload.estimateId !== estimateId) {
      return { error: "Invalid token for this estimate" };
    }

    // Check if token is expired (jwtVerify already checks this, but for clarity)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { error: "Token has expired" };
    }

    // Fetch estimate using tenantId from token
    const estimate = await multiTenantDb.forTenant(payload.tenantId).run((prisma) =>
      prisma.estimate.findUnique({
        where: { id: estimateId },
        include: {
          client: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true, email: true } },
        },
      })
    );

    if (!estimate) {
      return { error: "Estimate not found" };
    }

    return { 
      data: {
        estimate,
        tenantId: payload.tenantId
      }
    };
  } catch (error) {
    console.error("Token validation failed:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        return { error: "Token has expired (48 hours)" };
      }
      if (error.message.includes("signature")) {
        return { error: "Invalid token signature" };
      }
    }
    
    return { error: "Invalid or expired token" };
  }
}

/**
 * Update estimate status (approve or reject)
 */
export async function updateEstimateApproval(
  token: string, 
  estimateId: string, 
  action: "approve" | "reject"
) {
  try {
    // Validate token first
    const validation = await validateEstimateToken(token, estimateId);
    
    if (validation.error || !validation.data) {
      return { error: validation.error || "Validation failed" };
    }

    const { estimate, tenantId } = validation.data;

    // Check if already approved or rejected
    if (estimate.status === "ACCEPTED") {
      return { error: "This estimate has already been approved" };
    }
    
    if (estimate.status === "REJECTED") {
      return { error: "This estimate has already been rejected" };
    }

    const newStatus = action === "approve" ? "ACCEPTED" : "REJECTED";

    // Update estimate status
    const updated = await multiTenantDb.forTenant(tenantId).run((prisma) =>
      prisma.estimate.update({
        where: { id: estimateId },
        data: {
          status: newStatus,
          statusChangedAt: new Date(),
        },
        include: {
          client: { select: { name: true } },
          lead: { select: { name: true } },
        },
      })
    );

    revalidatePath(`/estimate/${estimateId}`);

    return { data: updated };
  } catch (error) {
    console.error(`Failed to ${action} estimate:`, error);
    return { error: `Failed to ${action} estimate` };
  }
}
