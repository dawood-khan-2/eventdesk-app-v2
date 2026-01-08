"use server";

import { multiTenantDb, database, TaskStatus } from "@repo/database";
import { getTenantContext } from "../lib/auth-helpers";
import { calculateEstimateTotal } from "../lib/estimate-helpers";

export async function getEventsThisWeek() {
  const { internalOrgId } = await getTenantContext();

  // Calculate start and end of current week (Sunday to Saturday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const count = await prisma.event.count({
      where: {
        startDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    return count;
  });
}

export async function getOpenTasksCount() {
  const { internalOrgId } = await getTenantContext();

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const count = await prisma.task.count({
      where: {
        status: {
          notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
        },
      },
    });

    return count;
  });
}

export async function getBudgetUtilization() {
  const { internalOrgId } = await getTenantContext();

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get sum of bills for upcoming/ongoing events only (endDate >= today)
    const billsAggregate = await prisma.bill.aggregate({
      where: {
        event: {
          endDate: {
            gte: today,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalBills = billsAggregate._sum.amount || 0;

    // Get estimates (SENT/ACCEPTED) for upcoming/ongoing events only
    const estimates = await prisma.estimate.findMany({
      where: {
        status: {
          in: ["SENT", "ACCEPTED"],
        },
        eventId: {
          not: null,
        },
        event: {
          endDate: {
            gte: today,
          },
        },
      },
      select: {
        lineItems: true,
        discount: true,
      },
    });

    // Calculate total of all estimates
    const totalEstimates = estimates.reduce((sum, estimate) => {
      const lineItems = estimate.lineItems as any[];
      const discount = estimate.discount || 0;
      return sum + calculateEstimateTotal(lineItems, discount);
    }, 0);

    // Calculate utilization percentage
    if (totalEstimates === 0) {
      return "N/A";
    }

    const utilization = (totalBills / totalEstimates) * 100;
    return `${Math.round(utilization)}%`;
  });
}

export async function getBillsDue() {
  const { internalOrgId, clerkOrgId } = await getTenantContext();

  // Get organization currency outside RLS transaction
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { currencyCode: true },
  });

  const currencyCode = org?.currencyCode || "USD";

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    // Get all bills with their payment records
    const bills = await prisma.bill.findMany({
      select: {
        amount: true,
        paymentRecords: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Calculate total unpaid amount
    const totalUnpaid = bills.reduce((sum, bill) => {
      const paidAmount = bill.paymentRecords.reduce(
        (paid, record) => paid + record.amount,
        0
      );
      const unpaid = bill.amount - paidAmount;
      return sum + (unpaid > 0 ? unpaid : 0);
    }, 0);

    // Format with currency
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(totalUnpaid);
  });
}

export async function getLeadConversionRate() {
  const { internalOrgId } = await getTenantContext();

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    // Calculate start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Count all leads created in current month
    const totalLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Count converted leads created in current month
    const convertedLeads = await prisma.lead.count({
      where: {
        status: "CONVERTED",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate conversion rate
    if (totalLeads === 0) {
      return "N/A";
    }

    const conversionRate = (convertedLeads / totalLeads) * 100;
    return `${conversionRate.toFixed(1)}%`;
  });
}

export async function getCSATScore() {
  const { internalOrgId } = await getTenantContext();

  // Tenant-scoped query
  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    // Get all events with ratings
    const ratedEvents = await prisma.event.findMany({
      where: {
        rating: {
          not: null,
        },
      },
      select: {
        rating: true,
      },
    });

    // If no events have been rated yet
    if (ratedEvents.length === 0) {
      return "N/A";
    }

    // Calculate CSAT Score
    const totalRating = ratedEvents.reduce((sum, event) => sum + (event.rating || 0), 0);
    const maxPossibleRating = ratedEvents.length * 5;
    const csatScore = (totalRating / maxPossibleRating) * 100;

    return `${csatScore.toFixed(1)}%`;
  });
}

export async function getTopEventsWithOpenTasks() {
  const { internalOrgId } = await getTenantContext();

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get ongoing/upcoming events with their tasks
    const events = await prisma.event.findMany({
      where: {
        endDate: {
          gte: today,
        },
      },
      select: {
        id: true,
        name: true,
        tasks: {
          select: {
            status: true,
          },
        },
      },
    });

    // Calculate stats for each event
    const eventsWithStats = events
      .map((event) => {
        const totalTasks = event.tasks.length;
        const openTasks = event.tasks.filter(
          (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"
        ).length;

        // Only include events that have at least 1 task
        if (totalTasks === 0) return null;

        const percentage = (openTasks / totalTasks) * 100;

        return {
          id: event.id,
          name: event.name,
          openTasks,
          percentage: Math.round(percentage),
        };
      })
      .filter((event) => event !== null) as Array<{
        id: string;
        name: string;
        openTasks: number;
        percentage: number;
      }>;

    // Sort by number of open tasks (descending) and take top 3
    return eventsWithStats.sort((a, b) => b.openTasks - a.openTasks).slice(0, 3);
  });
}

export async function getTopEventsWithOverdueTasks() {
  const { internalOrgId } = await getTenantContext();

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get ongoing/upcoming events with their tasks
    const events = await prisma.event.findMany({
      where: {
        endDate: {
          gte: today,
        },
      },
      select: {
        id: true,
        name: true,
        tasks: {
          select: {
            status: true,
            dueDate: true,
          },
        },
      },
    });

    // Calculate stats for each event
    const eventsWithStats = events
      .map((event) => {
        const openTasks = event.tasks.filter(
          (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"
        );
        
        const overdueTasks = openTasks.filter(
          (task) => task.dueDate && task.dueDate < today
        ).length;

        // Only include events that have open tasks and at least 1 overdue task
        if (openTasks.length === 0 || overdueTasks === 0) return null;

        const percentage = (overdueTasks / openTasks.length) * 100;

        return {
          id: event.id,
          name: event.name,
          percentage: Math.round(percentage),
        };
      })
      .filter((event) => event !== null) as Array<{
        id: string;
        name: string;
        percentage: number;
      }>;

    // Sort by percentage (descending) and take top 3
    return eventsWithStats.sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  });
}

export async function getTopEventsWithIdleTasks() {
  const { internalOrgId } = await getTenantContext();

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get ongoing/upcoming events with their tasks
    const events = await prisma.event.findMany({
      where: {
        endDate: {
          gte: today,
        },
      },
      select: {
        id: true,
        name: true,
        tasks: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
      },
    });

    // Calculate stats for each event
    const eventsWithStats = events
      .map((event) => {
        const openTasks = event.tasks.filter(
          (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED"
        );
        
        const idleTasks = openTasks.filter(
          (task) => task.updatedAt < weekAgo
        ).length;

        // Only include events that have open tasks and at least 1 idle task
        if (openTasks.length === 0 || idleTasks === 0) return null;

        const percentage = (idleTasks / openTasks.length) * 100;

        return {
          id: event.id,
          name: event.name,
          idleTasks,
          percentage: Math.round(percentage),
        };
      })
      .filter((event) => event !== null) as Array<{
        id: string;
        name: string;
        idleTasks: number;
        percentage: number;
      }>;

    // Sort by number of idle tasks (descending) and take top 3
    return eventsWithStats.sort((a, b) => b.idleTasks - a.idleTasks).slice(0, 3);
  });
}
