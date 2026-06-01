"use client";

import { Card } from "@repo/design-system/components/ui/card";
import { Button } from "@repo/design-system/components/ui/button";
import { MapPin, Calendar, Pencil, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

interface EventOverviewCardProps {
  event: any;
  onEditClick: () => void;
  onSwitcherClick: () => void;
  userRole?: string | null;
}

export function EventOverviewCard({ event, onEditClick, onSwitcherClick, userRole }: EventOverviewCardProps) {
  const formatDateTime = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <Card className="p-4">
      {/* Mobile Layout - Stacked */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold flex-1">{event.name}</h1>
          <div className="flex items-center gap-1 flex-shrink-0">
            {userRole !== "org:member" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditClick}
                title="Edit event"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSwitcherClick}
              title="Switch event"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="sr-only">Switch event</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 text-sm">
          {event.venue && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{event.venue}</span>
            </div>
          )}
          
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="break-words">
              {formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}
            </span>
          </div>
          
          {event.client?.name && (
            <div className="text-muted-foreground">
              Client: <span className="font-medium text-foreground">{event.client.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Single Line */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        {/* Left side - Event info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate flex-shrink-0">{event.name}</h1>
          
          {event.venue && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {formatDateTime(event.startDate)} to {formatDateTime(event.endDate)}
            </span>
          </div>
          
          {event.client?.name && (
            <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
              Client: <span className="font-medium text-foreground">{event.client.name}</span>
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {userRole !== "org:member" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditClick}
              title="Edit event"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwitcherClick}
            title="Switch event"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="sr-only">Switch event</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
