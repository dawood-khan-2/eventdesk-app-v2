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

export async function getTopCostCategories() {
  const { internalOrgId, clerkOrgId } = await getTenantContext();

  // Get organization currency outside RLS transaction
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { currencyCode: true },
  });

  const currencyCode = org?.currencyCode || "USD";

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    // Calculate start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get all bills for current month
    const bills = await prisma.bill.findMany({
      where: {
        billDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        serviceCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate total spend
    const totalSpend = bills.reduce((sum, bill) => sum + bill.amount, 0);

    // If no bills, return empty array
    if (totalSpend === 0) {
      return { categories: [], totalSpend: "N/A" };
    }

    // Format total spend
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formattedTotalSpend = formatter.format(totalSpend);

    // Group by service category and calculate totals
    const categoryMap = new Map<string, { name: string; total: number }>();
    
    for (const bill of bills) {
      const categoryId = bill.serviceCategory.id;
      const categoryName = bill.serviceCategory.name;
      const existing = categoryMap.get(categoryId) || { name: categoryName, total: 0 };
      existing.total += bill.amount;
      categoryMap.set(categoryId, existing);
    }

    // Convert to array and calculate percentages
    const categories = Array.from(categoryMap.entries()).map(([id, data]) => {
      const percentage = (data.total / totalSpend) * 100;

      return {
        id,
        name: data.name,
        total: data.total,
        formattedTotal: formatter.format(data.total),
        percentage: Math.round(percentage),
      };
    });

    // Sort by total (descending) and take top 5
    return {
      categories: categories.sort((a, b) => b.total - a.total).slice(0, 5),
      totalSpend: formattedTotalSpend,
    };
  });
}

export async function getPendingPaymentsByStatus() {
  const { internalOrgId, clerkOrgId } = await getTenantContext();

  // Get organization currency outside RLS transaction
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { currencyCode: true },
  });

  const currencyCode = org?.currencyCode || "USD";

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Calculate start of last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    // Calculate end of current month
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfCurrentMonth.setHours(23, 59, 59, 999);

    // Calculate end of current week (Sunday to Saturday)
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - currentDay));
    endOfWeek.setHours(23, 59, 59, 999);

    // Get bills from last month + this month with their payment records
    const bills = await prisma.bill.findMany({
      where: {
        billDate: {
          gte: startOfLastMonth,
          lte: endOfCurrentMonth,
        },
      },
      select: {
        amount: true,
        dueDate: true,
        paymentRecords: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Calculate pending amounts by status
    let overdue = 0;
    let dueThisWeek = 0;
    let dueLater = 0;

    for (const bill of bills) {
      const paidAmount = bill.paymentRecords.reduce(
        (sum, record) => sum + record.amount,
        0
      );
      const unpaidAmount = bill.amount - paidAmount;

      // Only include bills with unpaid amount > 0
      if (unpaidAmount > 0) {
        if (bill.dueDate < today) {
          overdue += unpaidAmount;
        } else if (bill.dueDate <= endOfWeek) {
          dueThisWeek += unpaidAmount;
        } else {
          dueLater += unpaidAmount;
        }
      }
    }

    // Format currency
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return [
      { status: "Overdue", amount: formatter.format(overdue) },
      { status: "Due this week", amount: formatter.format(dueThisWeek) },
      { status: "Due later", amount: formatter.format(dueLater) },
    ];
  });
}

export async function getPendingPaymentsByVendors() {
  const { internalOrgId, clerkOrgId } = await getTenantContext();

  // Get organization currency outside RLS transaction
  const org = await database.organization.findUnique({
    where: { clerkId: clerkOrgId },
    select: { currencyCode: true },
  });

  const currencyCode = org?.currencyCode || "USD";

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const now = new Date();

    // Calculate start of last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    // Calculate end of current month
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfCurrentMonth.setHours(23, 59, 59, 999);

    // Get bills from last month + this month with their payment records and vendor info
    const bills = await prisma.bill.findMany({
      where: {
        billDate: {
          gte: startOfLastMonth,
          lte: endOfCurrentMonth,
        },
      },
      select: {
        amount: true,
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        paymentRecords: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Group by vendor and calculate pending amounts
    const vendorMap = new Map<string, { name: string; amountDue: number }>();

    for (const bill of bills) {
      const paidAmount = bill.paymentRecords.reduce(
        (sum, record) => sum + record.amount,
        0
      );
      const unpaidAmount = bill.amount - paidAmount;

      // Only include bills with unpaid amount > 0
      if (unpaidAmount > 0) {
        const vendorId = bill.vendor.id;
        const existing = vendorMap.get(vendorId) || {
          name: bill.vendor.companyName,
          amountDue: 0,
        };
        existing.amountDue += unpaidAmount;
        vendorMap.set(vendorId, existing);
      }
    }

    // Format currency
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Convert to array and format
    const vendors = Array.from(vendorMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      amountDue: data.amountDue,
      formattedAmount: formatter.format(data.amountDue),
    }));

    // Sort by amount due (descending) and take top 5
    return vendors.sort((a, b) => b.amountDue - a.amountDue).slice(0, 5);
  });
}

export async function getLeadsFunnelData() {
  const { internalOrgId } = await getTenantContext();

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const now = new Date();
    
    // Calculate start and end of current quarter
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
    startOfQuarter.setHours(0, 0, 0, 0);

    const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
    endOfQuarter.setHours(23, 59, 59, 999);

    // Get all leads created in current quarter
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startOfQuarter,
          lte: endOfQuarter,
        },
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Count leads by status
    const statusCounts = {
      NEW: 0,
      CONTACTED: 0,
      PROPOSAL_SENT: 0,
      FOLLOW_UP: 0,
      CONVERTED: 0,
      LOST: 0,
    };

    for (const lead of leads) {
      statusCounts[lead.status]++;
    }

    // Build funnel data (exclude LOST)
    const funnelStages = [
      { name: "New", value: statusCounts.NEW, status: "NEW" },
      { name: "Contacted", value: statusCounts.CONTACTED, status: "CONTACTED" },
      { name: "Proposal Sent", value: statusCounts.PROPOSAL_SENT, status: "PROPOSAL_SENT" },
      { name: "Follow Up", value: statusCounts.FOLLOW_UP, status: "FOLLOW_UP" },
      { name: "Converted", value: statusCounts.CONVERTED, status: "CONVERTED" },
    ];

    // Calculate metrics
    const totalLeads = leads.length;
    const convertedLeads = statusCounts.CONVERTED;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

    // Calculate avg time to convert (using updatedAt as approximation)
    const convertedLeadsWithTime = leads.filter((l) => l.status === "CONVERTED");
    let avgTimeToConvert = "N/A";
    if (convertedLeadsWithTime.length > 0) {
      const totalDays = convertedLeadsWithTime.reduce((sum, lead) => {
        const days = Math.floor(
          (lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgTimeToConvert = `${Math.round(totalDays / convertedLeadsWithTime.length)} days`;
    }

    // Find highest drop-off between consecutive stages
    let highestDropOff = { stage: "N/A", percentage: 0 };
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const current = funnelStages[i].value;
      const next = funnelStages[i + 1].value;
      
      if (current > 0) {
        const dropPercentage = ((current - next) / current) * 100;
        if (dropPercentage > highestDropOff.percentage) {
          highestDropOff = {
            stage: `${funnelStages[i].name} → ${funnelStages[i + 1].name}`,
            percentage: Math.round(dropPercentage),
          };
        }
      }
    }

    return {
      funnelData: funnelStages,
      metrics: {
        conversionRate: `${conversionRate}%`,
        avgTimeToConvert,
        highestDropOff: `${highestDropOff.stage} (${highestDropOff.percentage}%)`,
      },
    };
  });
}

export async function getRepeatClientsData() {
  const { internalOrgId } = await getTenantContext();

  return multiTenantDb.forTenant(internalOrgId).run(async (prisma) => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Get all events with endDate in the rolling year
    const events = await prisma.event.findMany({
      where: {
        endDate: {
          gte: oneYearAgo,
        },
      },
      select: {
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group events by client
    const clientEventMap = new Map<string, { name: string; count: number }>();
    
    for (const event of events) {
      const clientId = event.clientId;
      const existing = clientEventMap.get(clientId) || {
        name: event.client.name,
        count: 0,
      };
      existing.count++;
      clientEventMap.set(clientId, existing);
    }

    // Calculate metrics
    const totalClients = clientEventMap.size;
    const totalEvents = events.length;
    const repeatClients = Array.from(clientEventMap.values()).filter(
      (client) => client.count >= 2
    ).length;

    const repeatPercentage = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;
    const avgEventsPerClient = totalClients > 0 ? (totalEvents / totalClients).toFixed(1) : "0.0";

    // Get top 5 repeat clients (only clients with 2+ events)
    const topRepeatClients = Array.from(clientEventMap.entries())
      .filter(([_, data]) => data.count >= 2)
      .map(([id, data]) => ({
        id,
        name: data.name,
        eventCount: data.count,
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 5);

    return {
      repeatPercentage: `${repeatPercentage}%`,
      avgEventsPerClient,
      topRepeatClients,
    };
  });
}
