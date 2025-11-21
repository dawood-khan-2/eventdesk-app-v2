"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import type { LeadStatus } from "@repo/database";
import { cn } from "@repo/design-system/lib/utils";

interface LeadStatsCardsProps {
  stats: {
    total: number;
    byStatus: Record<LeadStatus, number>;
  };
  selectedStatus?: LeadStatus;
  onStatusClick: (status: LeadStatus | undefined) => void;
}

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "text-blue-600 dark:text-blue-400" },
  CONTACTED: { label: "Contacted", color: "text-yellow-600 dark:text-yellow-400" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "text-purple-600 dark:text-purple-400" },
  FOLLOW_UP: { label: "Follow Up", color: "text-orange-600 dark:text-orange-400" },
  CONVERTED: { label: "Converted", color: "text-green-600 dark:text-green-400" },
  LOST: { label: "Lost", color: "text-red-600 dark:text-red-400" },
};

export function LeadStatsCards({ stats, selectedStatus, onStatusClick }: LeadStatsCardsProps) {
  const statusKeys = Object.keys(statusConfig) as LeadStatus[];

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {/* Status Cards */}
      {statusKeys.map((status) => {
        const config = statusConfig[status];
        const count = stats.byStatus[status] || 0;
        const isSelected = selectedStatus === status;

        return (
          <Card
            key={status}
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              isSelected && "border-primary"
            )}
            onClick={() => onStatusClick(isSelected ? undefined : status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-xl font-bold">{count}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
