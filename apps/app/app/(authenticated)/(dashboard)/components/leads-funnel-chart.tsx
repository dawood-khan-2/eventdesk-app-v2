"use client";

import { Funnel, FunnelChart, LabelList, Tooltip } from "recharts";
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

export function LeadsFunnelChart({ data, metrics }: LeadsFunnelChartProps) {
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
          <Funnel dataKey="value" data={data} isAnimationActive>
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
