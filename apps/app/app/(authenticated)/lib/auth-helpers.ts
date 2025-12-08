/**
 * Shared authentication and organization helpers for server actions
 */

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
