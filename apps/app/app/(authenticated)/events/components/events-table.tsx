"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { Pencil, MoreVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";

interface EventsTableProps {
  events: any[];
  isLoading: boolean;
  onEventClick: (event: any) => void;
  onEditClick: (event: any) => void;
}

function getEventStatus(event: any) {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (isFuture(start)) {
    return { label: "Upcoming", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/50" };
  } else if (isWithinInterval(now, { start, end })) {
    return { label: "Ongoing", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950/50" };
  } else {
    return { label: "Completed", color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-50 dark:bg-gray-950/50" };
  }
}

export function EventsTable({
  events,
  isLoading,
  onEventClick,
  onEditClick,
}: EventsTableProps) {

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="flex flex-col gap-3 md:hidden">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Desktop Loading */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No events found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {events.map((event) => {
          const status = getEventStatus(event);
          return (
            <Card
              key={event.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => onEventClick(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.client?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("border-0", status.bgColor, status.color)}>
                      {status.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(event);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {event.venue && (
                    <p className="text-muted-foreground">📍 {event.venue}</p>
                  )}
                  <p className="text-muted-foreground">
                    🗓️ {format(new Date(event.startDate), "PPp")}
                  </p>
                  <p className="text-muted-foreground">
                    ⏰ {format(new Date(event.endDate), "PPp")}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const status = getEventStatus(event);
              return (
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.client?.name || "-"}</TableCell>
                  <TableCell>{event.venue || "-"}</TableCell>
                  <TableCell>{format(new Date(event.startDate), "PPp")}</TableCell>
                  <TableCell>{format(new Date(event.endDate), "PPp")}</TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", status.bgColor, status.color)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(event);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
