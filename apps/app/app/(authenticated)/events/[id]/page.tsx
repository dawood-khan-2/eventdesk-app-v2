"use client";

import { notFound, useParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { getEvent } from "../actions";
import { Header } from "../../components/header";
import { EventOverviewCard } from "./components/event-overview-card";
import { EventSwitcher } from "./components/event-switcher";
import { EventSheet } from "../components/event-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";

export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState<any | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Load event data
  useEffect(() => {
    startTransition(async () => {
      const result = await getEvent(id);

      if (result.error || !result.data) {
        setNotFoundError(true);
        return;
      }

      setEvent(result.data);
    });
  }, [id]);

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    // Reload event data
    startTransition(async () => {
      const result = await getEvent(id);
      if (result.data) {
        setEvent(result.data);
      }
    });
  };

  if (notFoundError) {
    notFound();
  }

  if (!event) {
    return (
      <>
        <Header page="Loading..." pages={["Home", "Events"]} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
          <div className="rounded-md border p-4">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header page={event.name} pages={["Home", "Events"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <EventOverviewCard
          event={event}
          onEditClick={() => setIsSheetOpen(true)}
          onSwitcherClick={() => setIsSwitcherOpen(true)}
        />
        
        <Tabs defaultValue="tasks" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex md:flex md:w-full h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="tasks" className="whitespace-nowrap px-3 md:flex-1">Tasks</TabsTrigger>
              <TabsTrigger value="itinerary" className="whitespace-nowrap px-3 md:flex-1">Itinerary</TabsTrigger>
              <TabsTrigger value="services" className="whitespace-nowrap px-3 md:flex-1">Estimates</TabsTrigger>
              <TabsTrigger value="finances" className="whitespace-nowrap px-3 md:flex-1">Invoices</TabsTrigger>
              <TabsTrigger value="vendors" className="whitespace-nowrap px-3 md:flex-1">Bills</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Task Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage tasks and checklist for this event.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Itinerary</h2>
              <p className="text-sm text-muted-foreground">
                Plan and manage the event schedule and timeline.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Estimates</h2>
              <p className="text-sm text-muted-foreground">
                Manage estimates for this event.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="finances" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Invoices & Payments</h2>
              <p className="text-sm text-muted-foreground">
                Track invoices and payment status for this event.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Vendors & Bills</h2>
              <p className="text-sm text-muted-foreground">
                Manage vendor relationships and bills for this event.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Sheet for editing */}
      <EventSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        event={event}
        mode="edit"
        onSuccess={handleSheetSuccess}
      />

      {/* Event Switcher */}
      <EventSwitcher
        open={isSwitcherOpen}
        onOpenChange={setIsSwitcherOpen}
        currentEventId={id}
      />
    </>
  );
}
