"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
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
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {/* Status Badges */}
        {statusKeys.map((status) => {
          const config = statusConfig[status];
          const count = stats.byStatus[status] || 0;
          const isSelected = selectedStatus === status;

          return (
            <Badge
              key={status}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-accent whitespace-nowrap",
                isSelected && "border-primary",
                config.color
              )}
              onClick={() => onStatusClick(isSelected ? undefined : status)}
            >
              <span className="font-light">{config.label}</span> <span className="font-bold">{count}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
