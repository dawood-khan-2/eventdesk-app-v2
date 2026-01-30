"use server";

import { getUserRole as getRole } from "./auth-helpers";

/**
 * Server action to get user role for client components
 */
export async function getUserRole() {
  return await getRole();
}
