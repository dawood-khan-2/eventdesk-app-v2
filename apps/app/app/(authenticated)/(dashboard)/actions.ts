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
