import { auth } from "@repo/auth/server";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ClipboardList, BadgePercent, Receipt, Smile, Sigma } from "lucide-react";
import { Progress } from "@repo/design-system/components/ui/progress";
import { env } from "@/env";
import { AvatarStack } from "../components/avatar-stack";
import { Cursors } from "../components/cursors";
import { Header } from "../components/header";
import { StatCard } from "./components/stat-card";
import { LeadsFunnelChart } from "./components/leads-funnel-chart";
import { DashboardWrapper } from "./components/dashboard-wrapper";
import { hasOrganizationData, getEventsThisWeek, getOpenTasksCount, getBudgetUtilization, getBillsDue, getLeadConversionRate, getCSATScore, getTopEventsWithOpenTasks, getTopEventsWithOverdueTasks, getTopEventsWithIdleTasks, getTopCostCategories, getPendingPaymentsByStatus, getPendingPaymentsByVendors, getLeadsFunnelData, getRepeatClientsData } from "./actions";

const title = "EventDesk";
const description = "All-in-One Event Management Platform";

const CollaborationProvider = dynamic(() =>
  import("../components/collaboration-provider").then(
    (mod) => mod.CollaborationProvider
  )
);

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  // Check if organization has any data (events, clients, leads)
  const hasData = await hasOrganizationData();
  const showWelcome = !hasData;

  // Only load dashboard data if user has data
  let dashboardData = null;
  if (hasData) {
    const eventsThisWeek = await getEventsThisWeek();
    const openTasksCount = await getOpenTasksCount();
    const budgetUtilization = await getBudgetUtilization();
    const billsDue = await getBillsDue();
    const leadConversionRate = await getLeadConversionRate();
    const csatScore = await getCSATScore();
    const topEventsWithOpenTasks = await getTopEventsWithOpenTasks();
    const topEventsWithOverdueTasks = await getTopEventsWithOverdueTasks();
    const topEventsWithIdleTasks = await getTopEventsWithIdleTasks();
    const topCostCategories = await getTopCostCategories();
    const pendingPaymentsByStatus = await getPendingPaymentsByStatus();
    const pendingPaymentsByVendors = await getPendingPaymentsByVendors();
    const leadsFunnelData = await getLeadsFunnelData();
    const repeatClientsData = await getRepeatClientsData();

    dashboardData = {
      eventsThisWeek,
      openTasksCount,
      budgetUtilization,
      billsDue,
      leadConversionRate,
      csatScore,
      topEventsWithOpenTasks,
      topEventsWithOverdueTasks,
      topEventsWithIdleTasks,
      topCostCategories,
      pendingPaymentsByStatus,
      pendingPaymentsByVendors,
      leadsFunnelData,
      repeatClientsData,
    };
  }

  return (
    <DashboardWrapper showWelcome={showWelcome}>
      <Header page="Dashboard" pages={["Home"]}>
        {env.LIVEBLOCKS_SECRET && (
          <CollaborationProvider orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationProvider>
        )}
      </Header>
      {!hasData || !dashboardData ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground">No data to display.</p>
        </div>
      ) : (
      <div className="flex flex-1 flex-col gap-6 p-6" data-tour="dashboard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" data-tour="stats-overview">
          <StatCard
            title="Events this week"
            value={dashboardData.eventsThisWeek}
            icon={Calendar}
          />
          <StatCard
            title="Open Tasks"
            value={dashboardData.openTasksCount}
            icon={ClipboardList}
          />
          <StatCard
            title="Budget Utilization"
            value={dashboardData.budgetUtilization}
            icon={BadgePercent}
          />
          <StatCard
            title="Bills Due"
            value={dashboardData.billsDue}
            icon={Receipt}
          />
          <StatCard
            title="CSAT Score"
            value={dashboardData.csatScore}
            icon={Smile}
          />
          <StatCard
            title="Lead Conversion Rate"
            value={dashboardData.leadConversionRate}
            icon={Sigma}
          />
        </div>

        {/* Task Overview */}
        <section data-tour="task-overview">
          <h2 className="text-lg font-semibold mb-4">Task Overview</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Open Tasks */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Open Tasks</h3>
              {dashboardData.topEventsWithOpenTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-sm">Event Name</th>
                        <th className="text-right pb-3 font-medium text-sm"># of Open Tasks</th>
                        <th className="text-right pb-3 font-medium text-sm">% of Open Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.topEventsWithOpenTasks.map((event) => (
                        <tr key={event.id} className="border-b last:border-0">
                          <td className="py-3 text-sm">
                            <Link href={`/events/${event.id}`} className="hover:underline">
                              {event.name}
                            </Link>
                          </td>
                          <td className="text-right py-3 text-sm">{event.openTasks}</td>
                          <td className="text-right py-3 text-sm">{event.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">N/A</p>
              )}
            </div>

            {/* Overdue Tasks */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Overdue Tasks</h3>
              {dashboardData.topEventsWithOverdueTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {dashboardData.topEventsWithOverdueTasks.map((event) => {
                        const progressColor = 
                          event.percentage <= 33 ? "[&_[data-slot=progress-indicator]]:bg-green-500" :
                          event.percentage <= 66 ? "[&_[data-slot=progress-indicator]]:bg-yellow-500" :
                          "[&_[data-slot=progress-indicator]]:bg-red-500";
                        
                        return (
                          <tr key={event.id} className="border-b last:border-0">
                            <td className="py-3 text-sm">
                              <div className="space-y-2">
                                <Link href={`/events/${event.id}`} className="hover:underline">
                                  {event.name}
                                </Link>
                                <Progress 
                                  value={event.percentage} 
                                  className={progressColor}
                                />
                              </div>
                            </td>
                            <td className="text-right py-3 text-sm">{event.percentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">N/A</p>
              )}
            </div>

            {/* Idle Tasks */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Idle Tasks</h3>
              {dashboardData.topEventsWithIdleTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-sm">Event Name</th>
                        <th className="text-right pb-3 font-medium text-sm"># of Idle Tasks</th>
                        <th className="text-right pb-3 font-medium text-sm">% of Idle Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.topEventsWithIdleTasks.map((event) => (
                        <tr key={event.id} className="border-b last:border-0">
                          <td className="py-3 text-sm">
                            <Link href={`/events/${event.id}`} className="hover:underline">
                              {event.name}
                            </Link>
                          </td>
                          <td className="text-right py-3 text-sm">{event.idleTasks}</td>
                          <td className="text-right py-3 text-sm">{event.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">N/A</p>
              )}
            </div>
          </div>
        </section>

        {/* Finance Overview */}
        <section data-tour="finance-overview">
          <h2 className="text-lg font-semibold mb-4">Finance Overview</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Top 5 Cost Categories */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Top 5 Cost Categories</h3>
              {dashboardData.topCostCategories.categories.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <tbody>
                        {dashboardData.topCostCategories.categories.map((category) => {
                          const progressColor = 
                            category.percentage > 90 ? "[&_[data-slot=progress-indicator]]:bg-red-500" :
                            category.percentage >= 70 ? "[&_[data-slot=progress-indicator]]:bg-yellow-500" :
                            "[&_[data-slot=progress-indicator]]:bg-green-500";
                          
                          return (
                            <tr key={category.id} className="border-b last:border-0">
                              <td className="py-3 text-sm">
                                <div className="space-y-2">
                                  <div>{category.name}</div>
                                  <div className="relative">
                                    <Progress 
                                      value={category.percentage} 
                                      className={progressColor}
                                    />
                                    <div className="absolute right-0 top-0 text-xs text-muted-foreground mt-0.5">
                                      {category.percentage}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right py-3 text-sm font-medium">{category.formattedTotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-sm font-semibold">Total Spend</span>
                    <span className="text-sm font-bold">{dashboardData.topCostCategories.totalSpend}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">N/A</p>
              )}
            </div>

            {/* Pending Payments by Status */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Pending Payments by Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 font-medium text-sm">Status</th>
                      <th className="text-right pb-3 font-medium text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.pendingPaymentsByStatus.map((item) => (
                      <tr key={item.status} className="border-b last:border-0">
                        <td className="py-3 text-sm">{item.status}</td>
                        <td className="text-right py-3 text-sm font-medium">{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Payments by Vendors */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Pending Payments by Vendors</h3>
              {dashboardData.pendingPaymentsByVendors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-sm">Vendor</th>
                        <th className="text-right pb-3 font-medium text-sm">Amount Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.pendingPaymentsByVendors.map((vendor) => (
                        <tr key={vendor.id} className="border-b last:border-0">
                          <td className="py-3 text-sm">{vendor.name}</td>
                          <td className="text-right py-3 text-sm font-medium">{vendor.formattedAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">N/A</p>
              )}
            </div>
          </div>
        </section>

        {/* Client Engagement & Lead Insights */}
        <section data-tour="client-insights">
          <h2 className="text-lg font-semibold mb-4">Client Engagement & Lead Insights</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Leads Funnel */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Leads Funnel</h3>
              <LeadsFunnelChart data={dashboardData.leadsFunnelData.funnelData} metrics={dashboardData.leadsFunnelData.metrics} />
            </div>

            {/* Repeat Clients */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Repeat Clients</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{dashboardData.repeatClientsData.repeatPercentage}</div>
                  <p className="text-xs text-muted-foreground mt-1">of clients are repeat clients</p>
                </div>
                
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-sm text-muted-foreground">Average Events per client:</span>
                  <span className="text-sm font-medium">{dashboardData.repeatClientsData.avgEventsPerClient}</span>
                </div>

                {dashboardData.repeatClientsData.topRepeatClients.length > 0 ? (
                  <>
                    <h4 className="text-xs font-semibold mt-4">Top Repeat Clients</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left pb-2 font-medium text-xs">Client Name</th>
                            <th className="text-right pb-2 font-medium text-xs"># Events</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.repeatClientsData.topRepeatClients.map((client) => (
                            <tr key={client.id} className="border-b last:border-0">
                              <td className="py-2 text-xs">{client.name}</td>
                              <td className="text-right py-2 text-xs">{client.eventCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No repeat clients yet</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      )}
    </DashboardWrapper>
  );
};

export default App;
