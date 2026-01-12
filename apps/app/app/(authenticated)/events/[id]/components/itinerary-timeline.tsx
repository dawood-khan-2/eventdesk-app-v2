"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";
import { Button } from "@repo/design-system/components/ui/button";
import { Timeline, TimelineItem } from "../../../../../components/timeline";
import { ItineraryEditDialog, ItineraryDeleteDialog } from "./itinerary-actions";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { format, isSameDay, differenceInDays } from "date-fns";

interface Itinerary {
  id: string;
  title: string;
  date: Date | string;
  createdAt: Date | string;
}

interface ItineraryTimelineProps {
  itineraries: Itinerary[];
  eventStartDate: Date | string;
  eventEndDate: Date | string;
  onRefresh: () => void;
}

interface GroupedItineraries {
  [dateKey: string]: {
    date: Date;
    items: Itinerary[];
  };
}

export function ItineraryTimeline({ 
  itineraries, 
  eventStartDate,
  eventEndDate,
  onRefresh 
}: ItineraryTimelineProps) {
  const [groupedItineraries, setGroupedItineraries] = useState<GroupedItineraries>({});
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  
  // Edit/Delete dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    // Group itineraries by date
    const grouped: GroupedItineraries = {};
    
    itineraries.forEach((item) => {
      const itemDate = new Date(item.date);
      const dateKey = format(itemDate, "yyyy-MM-dd");
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: itemDate,
          items: [],
        };
      }
      
      grouped[dateKey].items.push(item);
    });

    // Sort items within each date by time
    Object.keys(grouped).forEach(key => {
      grouped[key].items.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    setGroupedItineraries(grouped);
    setDateKeys(Object.keys(grouped).sort());
  }, [itineraries]);

  // Calculate day numbers relative to event start
  const getDayNumber = (date: Date) => {
    const start = new Date(eventStartDate);
    const targetDate = new Date(date);
    return differenceInDays(targetDate, start) + 1;
  };

  if (itineraries.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No itinerary items yet. Click "Add Itinerary" to get started.
        </p>
      </div>
    );
  }

  if (dateKeys.length === 0) {
    return null;
  }

  // Single day event or only one day has items
  if (dateKeys.length === 1) {
    const dateKey = dateKeys[0];
    const dayData = groupedItineraries[dateKey];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">
            Day {getDayNumber(dayData.date)} - {format(dayData.date, "MMMM d, yyyy")}
          </h3>
        </div>
        
        <Timeline size="sm">
          {dayData.items.map((item) => (
            <div key={item.id} className="group relative">
              <TimelineItem
                date={format(new Date(item.date), "h:mm a")}
                title={item.title}
                icon={<Clock className="h-4 w-4" />}
                iconColor="primary"
                status="completed"
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedItinerary(item);
                    setEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    setSelectedItinerary(item);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </Timeline>

        {/* Edit Dialog */}
        <ItineraryEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          itinerary={selectedItinerary}
          onSuccess={onRefresh}
        />

        {/* Delete Dialog */}
        <ItineraryDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itinerary={selectedItinerary}
          onSuccess={onRefresh}
        />
      </div>
    );
  }

  // Multi-day event with tabs
  return (
    <>
      <Tabs defaultValue={dateKeys[0]} className="w-full">
      <TabsList className="w-full flex flex-wrap h-auto">
        {dateKeys.map((dateKey) => {
          const dayData = groupedItineraries[dateKey];
          const dayNumber = getDayNumber(dayData.date);
          
          return (
            <TabsTrigger 
              key={dateKey} 
              value={dateKey}
              className="flex-1 min-w-[120px]"
            >
              <div className="flex flex-col items-center">
                <span className="text-xs font-normal">Day {dayNumber}</span>
                <span className="text-sm font-medium">{format(dayData.date, "MMM d")}</span>
              </div>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {dateKeys.map((dateKey) => {
        const dayData = groupedItineraries[dateKey];
        
        return (
          <TabsContent key={dateKey} value={dateKey} className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {format(dayData.date, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>
            
            <Timeline size="sm">
              {dayData.items.map((item) => (
                <div key={item.id} className="group relative">
                  <TimelineItem
                    date={format(new Date(item.date), "h:mm a")}
                    title={item.title}
                    icon={<Clock className="h-4 w-4" />}
                    iconColor="primary"
                    status="completed"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedItinerary(item);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedItinerary(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </Timeline>
          </TabsContent>
        );
      })}
    </Tabs>

    {/* Edit Dialog */}
    <ItineraryEditDialog
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      itinerary={selectedItinerary}
      onSuccess={onRefresh}
    />

    {/* Delete Dialog */}
    <ItineraryDeleteDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      itinerary={selectedItinerary}
      onSuccess={onRefresh}
    />
  </>
  );
}
