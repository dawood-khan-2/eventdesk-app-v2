"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import type { EventFilter } from "../actions";
import { cn } from "@repo/design-system/lib/utils";

interface EventStatsCardsProps {
  stats: {
    total: number;
    byFilter: Record<EventFilter, number>;
  };
  selectedFilter?: EventFilter;
  onFilterClick: (filter: EventFilter | undefined) => void;
}

const filterConfig: Record<EventFilter, { label: string; color: string }> = {
  UPCOMING: { label: "Upcoming", color: "text-blue-600 dark:text-blue-400" },
  ONGOING: { label: "Ongoing", color: "text-green-600 dark:text-green-400" },
  COMPLETED: { label: "Completed", color: "text-gray-600 dark:text-gray-400" },
};

export function EventStatsCards({ stats, selectedFilter, onFilterClick }: EventStatsCardsProps) {
  const filterKeys = Object.keys(filterConfig) as EventFilter[];

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {/* Filter Badges */}
        {filterKeys.map((filter) => {
          const config = filterConfig[filter];
          const count = stats.byFilter[filter] || 0;
          const isSelected = selectedFilter === filter;

          return (
            <Badge
              key={filter}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-accent whitespace-nowrap",
                isSelected && "border-primary",
                config.color
              )}
              onClick={() => onFilterClick(isSelected ? undefined : filter)}
            >
              <span className="font-light">{config.label}</span> <span className="font-bold">{count}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
