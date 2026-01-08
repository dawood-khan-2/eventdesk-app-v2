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
import { getEventsThisWeek, getOpenTasksCount, getBudgetUtilization, getBillsDue, getLeadConversionRate, getCSATScore, getTopEventsWithOpenTasks, getTopEventsWithOverdueTasks, getTopEventsWithIdleTasks } from "./actions";

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

  const eventsThisWeek = await getEventsThisWeek();
  const openTasksCount = await getOpenTasksCount();
  const budgetUtilization = await getBudgetUtilization();
  const billsDue = await getBillsDue();
  const leadConversionRate = await getLeadConversionRate();
  const csatScore = await getCSATScore();
  const topEventsWithOpenTasks = await getTopEventsWithOpenTasks();
  const topEventsWithOverdueTasks = await getTopEventsWithOverdueTasks();
  const topEventsWithIdleTasks = await getTopEventsWithIdleTasks();

  return (
    <>
      <Header page="Dashboard" pages={["Home"]}>
        {env.LIVEBLOCKS_SECRET && (
          <CollaborationProvider orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationProvider>
        )}
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Events this week"
            value={eventsThisWeek}
            icon={Calendar}
          />
          <StatCard
            title="Open Tasks"
            value={openTasksCount}
            icon={ClipboardList}
          />
          <StatCard
            title="Budget Utilization"
            value={budgetUtilization}
            icon={BadgePercent}
          />
          <StatCard
            title="Bills Due"
            value={billsDue}
            icon={Receipt}
          />
          <StatCard
            title="CSAT Score"
            value={csatScore}
            icon={Smile}
          />
          <StatCard
            title="Lead Conversion Rate"
            value={leadConversionRate}
            icon={Sigma}
          />
        </div>

        {/* Task Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Task Overview</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Open Tasks */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Open Tasks</h3>
              {topEventsWithOpenTasks.length > 0 ? (
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
                      {topEventsWithOpenTasks.map((event) => (
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
              {topEventsWithOverdueTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {topEventsWithOverdueTasks.map((event) => {
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
              {topEventsWithIdleTasks.length > 0 ? (
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
                      {topEventsWithIdleTasks.map((event) => (
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
        <section>
          <h2 className="text-lg font-semibold mb-4">Finance Overview</h2>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">Finance overview content coming soon...</p>
          </div>
        </section>

        {/* Client Engagement & Lead Insights */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Client Engagement & Lead Insights</h2>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">Client engagement and lead insights coming soon...</p>
          </div>
        </section>
      </div>
    </>
  );
};

export default App;
