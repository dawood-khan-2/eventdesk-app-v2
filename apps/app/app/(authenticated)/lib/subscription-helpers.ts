import { database, multiTenantDb } from "@repo/database";

/**
 * Helper function to check if user can create events based on subscription
 */
export async function checkEventCreationLimit(internalUserId: string, internalOrgId: string) {
  // Check if user has an active subscription
  const subscription = await database.subscription.findUnique({
    where: { userId: internalUserId },
  });

  // If subscription exists (even if cancelled), allow unlimited events
  if (subscription) {
    return { allowed: true };
  }

  // User is on Free plan - check event count for current billing cycle
  const user = await database.user.findUnique({
    where: { id: internalUserId },
    select: { createdAt: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Calculate current billing cycle based on user's account creation date
  const now = new Date();
  const userCreatedAt = user.createdAt;
  
  // Get the day of month when user was created
  const billingDayOfMonth = userCreatedAt.getDate();
  
  // Calculate start of current billing cycle
  let cycleStart = new Date(now.getFullYear(), now.getMonth(), billingDayOfMonth);
  
  // If we haven't reached the billing day this month yet, cycle started last month
  if (now.getDate() < billingDayOfMonth) {
    cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDayOfMonth);
  }
  
  // Calculate end of current billing cycle (start of next cycle)
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);

  // Count events created in current billing cycle
  const eventCount = await multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    return prisma.event.count({
      where: {
        createdAt: {
          gte: cycleStart,
          lt: cycleEnd,
        },
      },
    });
  });

  // Free tier allows 2 events per month
  if (eventCount >= 2) {
    return {
      allowed: false,
      error: "You've reached the limit of 2 events per month on the Free plan. Upgrade to Pro for unlimited events.",
    };
  }

  return { allowed: true };
}
