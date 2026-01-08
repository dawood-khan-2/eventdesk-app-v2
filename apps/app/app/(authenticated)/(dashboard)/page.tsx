import { auth } from "@repo/auth/server";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Calendar, ClipboardList, BadgePercent, Receipt, Smile, Sigma } from "lucide-react";
import { env } from "@/env";
import { AvatarStack } from "../components/avatar-stack";
import { Cursors } from "../components/cursors";
import { Header } from "../components/header";
import { StatCard } from "./components/stat-card";
import { getEventsThisWeek, getOpenTasksCount, getBudgetUtilization, getBillsDue, getLeadConversionRate, getCSATScore } from "./actions";

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
      </div>
    </>
  );
};

export default App;
