/**
 * Shared authentication and organization helpers for server actions
 */

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";

/**
 * Helper to get the internal organization ID from Clerk's orgId
 * 
 * @param clerkOrgId - The Clerk organization ID
 * @returns The internal database organization ID
 * @throws Error if organization is not found
 */
export async function getInternalOrgId(clerkOrgId: string): Promise<string> {
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { id: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return org.id;
}

/**
 * Get authenticated user context with internal organization ID
 * Combines auth check and org ID lookup for DRY server actions
 * 
 * @returns Object containing clerkOrgId and internalOrgId
 * @throws Error if unauthorized or organization not found
 */
export async function getTenantContext() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const internalOrgId = await getInternalOrgId(orgId);

  return { clerkOrgId: orgId, internalOrgId };
}
