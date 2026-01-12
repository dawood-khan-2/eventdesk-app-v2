import { Card } from "@repo/design-system/components/ui/card";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    data: string;
    comparedTo: string;
  };
  icon?: LucideIcon;
}

export function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
  const getTrendData = () => {
    if (!trend) return null;
    
    // Check if the data includes a percent sign
    const hasPercent = trend.data.includes('%');
    
    // Parse numeric value (remove %, +, and any whitespace)
    const numericValue = parseFloat(trend.data.replace('%', '').replace('+', '').trim());
    
    // Handle edge cases
    if (isNaN(numericValue)) return null;
    
    // Determine if positive or negative
    const isPositive = numericValue > 0;
    const isNegative = numericValue < 0;
    const isZero = numericValue === 0;
    
    // Arrow and color logic
    let arrow = '';
    let colorClass = '';
    
    if (isZero) {
      arrow = '→';
      colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    } else if (isPositive) {
      arrow = '↗︎';
      colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    } else {
      arrow = '↘︎';
      colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    }
    
    // Format display with or without percent
    const absValue = Math.abs(numericValue);
    const formattedValue = Number.isInteger(absValue) ? absValue.toString() : absValue.toFixed(2).replace(/\.?0+$/, '');
    const display = `${arrow} ${formattedValue}${hasPercent ? '%' : ''}`;
    
    return { arrow, colorClass, display, comparedTo: trend.comparedTo };
  };
  
  const trendData = getTrendData();
  
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-0.5">
        <div className="text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex items-center justify-center gap-2 leading-none">
        <div className="text-3xl font-bold">{value}</div>
        {trendData && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className={`text-xs font-medium ${trendData.colorClass} cursor-help`}>
                  {trendData.display}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>vs {trendData.comparedTo}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}
