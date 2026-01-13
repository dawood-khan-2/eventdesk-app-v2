"use client";

import { Funnel, FunnelChart, LabelList, Tooltip, Cell } from "recharts";
import { Card } from "@repo/design-system/components/ui/card";
import { ChartContainer } from "@repo/design-system/components/ui/chart";

interface LeadsFunnelChartProps {
  data: Array<{
    name: string;
    value: number;
    status: string;
  }>;
  metrics: {
    conversionRate: string;
    avgTimeToConvert: string;
    highestDropOff: string;
  };
}

// Color scheme for funnel stages (progressing from blue to green)
const FUNNEL_COLORS = [
  "hsl(217, 91%, 60%)", // Blue - New
  "hsl(207, 89%, 54%)", // Light Blue - Contacted
  "hsl(197, 71%, 52%)", // Cyan - Proposal Sent
  "hsl(173, 58%, 39%)", // Teal - Follow Up
  "hsl(142, 71%, 45%)", // Green - Converted
];

export function LeadsFunnelChart({ data, metrics }: LeadsFunnelChartProps) {
  // Filter out stages with 0 values to ensure funnel displays properly
  // Recharts Funnel can have issues rendering stages with 0 values
  const filteredData = data.filter(stage => stage.value > 0);
  
  return (
    <div className="space-y-4">
      <ChartContainer
        config={{
          value: {
            label: "Leads",
            color: "hsl(var(--chart-1))",
          },
        }}
        className="h-[300px]"
      >
        <FunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={filteredData} isAnimationActive>
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
            ))}
            <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
          </Funnel>
        </FunnelChart>
      </ChartContainer>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Conversion Rate:</span>
          <span className="font-medium">{metrics.conversionRate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg. time to convert:</span>
          <span className="font-medium">{metrics.avgTimeToConvert}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Highest drop-off at:</span>
          <span className="font-medium">{metrics.highestDropOff}</span>
        </div>
      </div>
    </div>
  );
}
