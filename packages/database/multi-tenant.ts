/**
 * Multi-Tenant Database Wrapper for PostgreSQL Row Level Security (RLS)
 * 
 * This module provides a clean abstraction for working with multi-tenant data
 * in PostgreSQL using Row Level Security (RLS). It ensures that all database
 * operations are automatically scoped to the specified tenant.
 * 
 * Key Features:
 * - Automatic tenant context setting via PostgreSQL session variables
 * - Transaction-based isolation to prevent tenant data leakage
 * - Type-safe wrapper around Prisma Client
 * - Reuses existing Neon adapter configuration
 * 
 * @example
 * ```typescript
 * import { multiTenantDb } from '@repo/database';
 * 
 * // All operations within this block are automatically scoped to 'org_123'
 * const items = await multiTenantDb.forTenant('org_123').run(async (prisma) => {
 *   return prisma.item.findMany();
 * });
 * ```
 */

import "server-only";

import { Prisma } from "@prisma/client";
import { database } from "./index";

/**
 * Executes a database operation within a specific tenant context.
 * 
 * This function:
 * 1. Starts a database transaction
 * 2. Sets the PostgreSQL session variable 'app.tenant_id' to the specified tenant
 * 3. Executes the provided handler function with the transaction client
 * 4. Ensures RLS policies automatically filter data by tenant
 * 
 * @param tenantId - The internal organization ID (Organization.id, NOT clerkId)
 * @param handler - Function that performs database operations using the transaction client
 * @returns Promise resolving to the handler's return value
 */
async function withTenantContext<T>(
  tenantId: string,
  handler: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  // Validate tenant ID to prevent potential issues
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('Invalid tenant ID provided');
  }

  return database.$transaction(async (tx) => {
    // Set the tenant context for this transaction
    // This session variable is used by the RLS policy to filter rows
    await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
    
    // Execute the user's database operations within the tenant context
    return handler(tx);
  }, {
    // Configure transaction timeout
    maxWait: 10000, // 10 seconds
    timeout: 30000, // 30 seconds
  });
}

/**
 * Multi-tenant database interface
 * 
 * Provides a fluent API for executing tenant-scoped database operations.
 */
export const multiTenantDb = {
  /**
   * Create a tenant-scoped database context
   * 
   * @param tenantId - The internal organization ID (Organization.id, NOT Organization.clerkId)
   * @returns Object with `run` method for executing operations
   * 
   * @example
   * ```typescript
   * // Get internal org ID from Clerk's org ID first
   * const org = await database.organization.findUnique({
   *   where: { clerkId: clerkOrgId },
   *   select: { id: true }
   * });
   * 
   * // Use internal ID for tenant scoping
   * const leads = await multiTenantDb.forTenant(org.id).run(async (db) => {
   *   return db.lead.findMany();
   * });
   * ```
   */
  forTenant: (tenantId: string) => ({
    /**
     * Execute database operations within the tenant context
     * 
     * @param fn - Function that performs database operations
     * @returns Promise resolving to the function's return value
     */
    run: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) =>
      withTenantContext(tenantId, fn),
  }),
};
