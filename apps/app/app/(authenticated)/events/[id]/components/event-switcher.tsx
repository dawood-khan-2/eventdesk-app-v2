"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import { searchEvents } from "../../actions";

interface EventSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEventId: string;
}

export function EventSwitcher({ open, onOpenChange, currentEventId }: EventSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load events when dialog opens or search changes
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      startTransition(async () => {
        const result = await searchEvents({ 
          query: searchQuery || undefined, 
          limit: 50 
        });
        if (result.data) {
          // Filter out current event
          setEvents(result.data.filter(e => e.id !== currentEventId));
        }
        setIsLoading(false);
      });
    }
  }, [open, searchQuery, currentEventId]);

  const handleSelect = (eventId: string) => {
    onOpenChange(false);
    router.push(`/events/${eventId}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search events..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading ? (
          <CommandEmpty>Loading...</CommandEmpty>
        ) : (
          <CommandEmpty>No events found.</CommandEmpty>
        )}
        <CommandGroup heading="Events">
          {events.map((event) => (
            <CommandItem
              key={event.id}
              value={event.name}
              onSelect={() => handleSelect(event.id)}
            >
              <div className="flex flex-col">
                <span>{event.name}</span>
                {event.client?.name && (
                  <span className="text-xs text-muted-foreground">
                    {event.client.name}
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
