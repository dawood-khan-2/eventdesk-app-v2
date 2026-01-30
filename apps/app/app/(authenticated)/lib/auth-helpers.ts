/**
 * Shared authentication and organization helpers for server actions
 */

import { auth, clerkClient } from "@repo/auth/server";
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

/**
 * Get full user context including user ID, org ID, and role
 * Useful for RBAC operations that need both user and tenant context
 * 
 * @returns Object containing user and organization IDs (both Clerk and internal) plus role
 * @throws Error if unauthorized or user/organization not found
 */
export async function getUserContext() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const internalOrgId = await getInternalOrgId(orgId);

  // Get internal user ID
  const user = await database.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    userId,
    internalUserId: user.id,
    orgId,
    internalOrgId,
    orgRole: orgRole || "org:member",
  };
}

/**
 * Get the user's role in the current organization from Clerk
 * 
 * @returns The user's role in the organization (e.g., "org:admin", "org:member")
 * @throws Error if unauthorized or role not found
 */
export async function getUserRole() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  // orgRole is provided by Clerk auth() and contains the role string
  return orgRole || "org:member";
}

/**
 * Check if the current user is an admin
 * 
 * @returns True if user has org:admin role, false otherwise
 */
export async function isAdmin() {
  const role = await getUserRole();
  return role === "org:admin";
}

/**
 * Check if the current user is a member (non-admin)
 * 
 * @returns True if user has org:member role, false otherwise
 */
export async function isMember() {
  const role = await getUserRole();
  return role === "org:member";
}
