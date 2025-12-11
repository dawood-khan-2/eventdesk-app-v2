"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@repo/design-system/components/ui/sheet";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { CalendarIcon, X, Plus, Clock } from "lucide-react";
import { createItineraries } from "../actions";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";

interface ItinerarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventStartDate: Date;
  eventEndDate: Date;
  onSuccess: () => void;
}

interface ItineraryItem {
  id: string;
  title: string;
  time: string;
}

export function ItinerarySheet({ 
  open, 
  onOpenChange, 
  eventId, 
  eventStartDate,
  eventEndDate,
  onSuccess 
}: ItinerarySheetProps) {
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(eventStartDate);
  const [items, setItems] = useState<ItineraryItem[]>([
    { id: crypto.randomUUID(), title: "", time: "" }
  ]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (open) {
      setSelectedDate(eventStartDate);
      setItems([{ id: crypto.randomUUID(), title: "", time: "" }]);
    }
  }, [open, eventStartDate]);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), title: "", time: "" }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: "title" | "time", value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // Filter out empty items
    const validItems = items.filter(item => item.title.trim());

    if (validItems.length === 0) {
      toast.error("Please add at least one itinerary item");
      return;
    }

    startTransition(async () => {
      // Combine date with time for each item
      const itineraryData = validItems.map(item => {
        let combinedDate = new Date(selectedDate);
        
        // If time is provided, parse and set it
        if (item.time.trim()) {
          const [hours, minutes] = item.time.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            combinedDate.setHours(hours, minutes, 0, 0);
          }
        }
        
        return {
          title: item.title.trim(),
          date: combinedDate.toISOString(),
        };
      });

      const result = await createItineraries(eventId, itineraryData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`${validItems.length} itinerary item(s) added successfully`);
      onSuccess();
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <form onSubmit={onSubmit}>
          <SheetHeader>
            <SheetTitle>Add Itinerary Items</SheetTitle>
            <SheetDescription>
              Add multiple items to the event schedule for a selected date.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6 px-6">
            {/* Date Selector */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      // Disable dates outside event range
                      return date < eventStartDate || date > eventEndDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <Label>Itinerary Items</Label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-24">
                      <Input
                        type="time"
                        value={item.time}
                        onChange={(e) => handleItemChange(item.id, "time", e.target.value)}
                        placeholder="Time"
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={item.title}
                        onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                        placeholder="e.g., Registration, Keynote Speech, Lunch Break"
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save All"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
