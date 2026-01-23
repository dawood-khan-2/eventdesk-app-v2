"use client";

import { notFound, useParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { getEvent, sendRegistrationLink } from "../actions";
import { getTasks, getItineraries, getGuests } from "./actions";
import { getEstimates } from "../../estimates/actions";
import { getInvoices } from "../../invoices/actions";
import { getBills } from "../../bills/actions";
import { getFinanceSettings, getServiceCategories } from "../../settings/actions";
import { Header } from "../../components/header";
import { EventOverviewCard } from "./components/event-overview-card";
import { EventSwitcher } from "./components/event-switcher";
import { EventSheet } from "../components/event-sheet";
import { TaskSheet } from "./components/task-sheet";
import { TaskEditDialog } from "./components/task-edit-dialog";
import { TasksTable } from "./components/tasks-table";
import { ItinerarySheet } from "./components/itinerary-sheet";
import { ItineraryTimeline } from "./components/itinerary-timeline";
import { GuestsTable } from "./components/guests-table";
import { EstimatesClient } from "../../estimates/components/estimates-client";
import { InvoicesClient } from "../../invoices/components/invoices-client";
import { BillsClient } from "../../bills/components/bills-client";
import { FeedbackTab } from "./components/feedback-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Mail } from "lucide-react";

export default function EventPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState<any | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isItinerarySheetOpen, setIsItinerarySheetOpen] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [isSendingRegistration, setIsSendingRegistration] = useState(false);
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0);
  
  // Task edit dialog state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [isSubtask, setIsSubtask] = useState(false);
  
  // Subtask creation state
  const [parentTaskForCreation, setParentTaskForCreation] = useState<any>(null);
  const [shouldReopenParentDialog, setShouldReopenParentDialog] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Itinerary state
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(false);
  const [itinerariesRefreshKey, setItinerariesRefreshKey] = useState(0);
  const [itinerarySearchQuery, setItinerarySearchQuery] = useState("");

  // Guests state
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [guestsSearchQuery, setGuestsSearchQuery] = useState("");

  // Estimates state
  const [estimates, setEstimates] = useState<any[]>([]);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);

  // Invoices state
  const [invoices, setInvoices] = useState<any[]>([]);

  // Bills state
  const [bills, setBills] = useState<any[]>([]);

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

  // Load estimates data for this event
  useEffect(() => {
    const loadEstimates = async () => {
      const [estimatesResult, financeSettings, categoriesResult] = await Promise.all([
        getEstimates(1, 100, "", id), // Filter by event ID
        getFinanceSettings(),
        getServiceCategories(),
      ]);
      
      if (estimatesResult.data) {
        const transformedEstimates = estimatesResult.data.map(estimate => ({
          ...estimate,
          createdAt: estimate.createdAt.toISOString(),
          eventStartDate: estimate.eventStartDate?.toISOString() || null,
          eventEndDate: estimate.eventEndDate?.toISOString() || null,
          lineItems: (estimate.lineItems as any[]) || []
        }));
        setEstimates(transformedEstimates);
      }
      
      if (financeSettings.data?.currencyCode) {
        setCurrencyCode(financeSettings.data.currencyCode);
      }
      
      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);
      }
    };

    loadEstimates();
  }, [id]);

  // Load invoices data for this event
  useEffect(() => {
    const loadInvoices = async () => {
      const invoicesResult = await getInvoices(1, 100, "", id); // Filter by event ID
      
      if (invoicesResult.data) {
        const transformedInvoices = invoicesResult.data.map((invoice: any) => ({
          ...invoice,
          createdAt: invoice.createdAt.toISOString(),
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          lineItems: (invoice.lineItems as any[]) || [],
        }));
        setInvoices(transformedInvoices);
      }
    };

    loadInvoices();
  }, [id]);

  // Load bills data for this event
  useEffect(() => {
    const loadBills = async () => {
      const billsResult = await getBills(1, 100, "", id); // Filter by event ID
      
      if (billsResult.data) {
        setBills(billsResult.data);
      }
    };

    loadBills();
  }, [id]);

  // Load tasks data
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoadingTasks(true);
      const result = await getTasks(id);
      
      if (result.data) {
        setTasks(result.data);
      }
      setIsLoadingTasks(false);
    };

    loadTasks();
  }, [id, tasksRefreshKey]);

  // Load itineraries data
  useEffect(() => {
    const loadItineraries = async () => {
      setIsLoadingItineraries(true);
      const result = await getItineraries(id);
      
      if (result.data) {
        setItineraries(result.data);
      }
      setIsLoadingItineraries(false);
    };

    loadItineraries();
  }, [id, itinerariesRefreshKey]);

  // Load guests data
  useEffect(() => {
    const loadGuests = async () => {
      setIsLoadingGuests(true);
      const result = await getGuests(id);
      
      if (result.data) {
        setGuests(result.data);
      }
      setIsLoadingGuests(false);
    };

    loadGuests();
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

  const handleTaskSheetSuccess = () => {
    setIsTaskSheetOpen(false);
    setParentTaskForCreation(null);
    // Trigger tasks refresh
    setTasksRefreshKey(prev => prev + 1);
    // If we were creating a subtask, reopen parent edit dialog
    if (shouldReopenParentDialog && selectedTaskId) {
      setTimeout(() => {
        setIsTaskEditOpen(true);
        setShouldReopenParentDialog(false);
      }, 100);
    }
  };

  // Handle task row click to open edit dialog
  const handleTaskClick = (task: any) => {
    setSelectedTaskId(task.id);
    setIsSubtask(!!task.parentTaskId);
    setIsTaskEditOpen(true);
  };

  // Handle create subtask from edit dialog
  const handleCreateSubtask = (parentTask: any) => {
    setParentTaskForCreation(parentTask);
    setShouldReopenParentDialog(true);
    setIsTaskEditOpen(false);
    setIsTaskSheetOpen(true);
  };

  // Handle task edit success
  const handleTaskEditSuccess = () => {
    setTasksRefreshKey(prev => prev + 1);
  };

  // Handle itinerary sheet success
  const handleItinerarySheetSuccess = () => {
    setIsItinerarySheetOpen(false);
    // Trigger itineraries refresh
    setItinerariesRefreshKey(prev => prev + 1);
  };

  // Handle send registration link
  const handleSendRegistrationLink = async () => {
    setIsSendingRegistration(true);
    const result = await sendRegistrationLink(id);
    setIsSendingRegistration(false);
    setIsRegistrationDialogOpen(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Registration link has been sent to the client's email.");
    }
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate tasks by type
  const preEventTasks = filteredTasks.filter((task) => task.type === "PRE_EVENT");
  const onEventTasks = filteredTasks.filter((task) => task.type === "ON_EVENT");
  const postEventTasks = filteredTasks.filter((task) => task.type === "POST_EVENT");

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
              <TabsTrigger value="guests" className="whitespace-nowrap px-3 md:flex-1">Guests</TabsTrigger>
              <TabsTrigger value="estimates" className="whitespace-nowrap px-3 md:flex-1">Estimates</TabsTrigger>
              <TabsTrigger value="invoices" className="whitespace-nowrap px-3 md:flex-1">Invoices</TabsTrigger>
              <TabsTrigger value="bills" className="whitespace-nowrap px-3 md:flex-1">Bills</TabsTrigger>
              <TabsTrigger value="feedback" className="whitespace-nowrap px-3 md:flex-1">Feedback</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setIsTaskSheetOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={["pre-event", "on-event", "post-event"]}
              className="space-y-4"
            >
              <AccordionItem value="pre-event" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="font-medium">
                    Pre-Event Tasks ({preEventTasks.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <TasksTable
                    tasks={preEventTasks}
                    isLoading={isLoadingTasks}
                    type="PRE_EVENT"
                    onTaskClick={handleTaskClick}
                    clickable
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="on-event" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="font-medium">
                    On-Event Tasks ({onEventTasks.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <TasksTable
                    tasks={onEventTasks}
                    isLoading={isLoadingTasks}
                    type="ON_EVENT"
                    onTaskClick={handleTaskClick}
                    clickable
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="post-event" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="font-medium">
                    Post-Event Tasks ({postEventTasks.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <TasksTable
                    tasks={postEventTasks}
                    isLoading={isLoadingTasks}
                    type="POST_EVENT"
                    onTaskClick={handleTaskClick}
                    clickable
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-4 mt-6">
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search itinerary..."
                  value={itinerarySearchQuery}
                  onChange={(e) => setItinerarySearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setIsItinerarySheetOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Itinerary
              </Button>
            </div>
            
            {isLoadingItineraries ? (
              <div className="rounded-lg border p-8">
                <p className="text-sm text-muted-foreground">Loading itinerary...</p>
              </div>
            ) : (
              <ItineraryTimeline
                itineraries={itineraries.filter(item => 
                  item.title.toLowerCase().includes(itinerarySearchQuery.toLowerCase())
                )}
                eventStartDate={event?.startDate || new Date()}
                eventEndDate={event?.endDate || new Date()}
                onRefresh={() => setItinerariesRefreshKey(prev => prev + 1)}
              />
            )}
          </TabsContent>

          <TabsContent value="guests" className="space-y-4 mt-6">
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search guests..."
                  value={guestsSearchQuery}
                  onChange={(e) => setGuestsSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                onClick={() => setIsRegistrationDialogOpen(true)} 
                className="w-full sm:w-auto"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Registration Link
              </Button>
            </div>
            
            {isLoadingGuests ? (
              <div className="rounded-lg border p-8">
                <p className="text-sm text-muted-foreground">Loading guests...</p>
              </div>
            ) : (
              <GuestsTable
                guests={guests.filter(guest => 
                  guest.name.toLowerCase().includes(guestsSearchQuery.toLowerCase()) ||
                  guest.email.toLowerCase().includes(guestsSearchQuery.toLowerCase()) ||
                  (guest.phone && guest.phone.toLowerCase().includes(guestsSearchQuery.toLowerCase()))
                )}
              />
            )}
          </TabsContent>

          <TabsContent value="estimates" className="space-y-4 mt-6">
            {event && (
              <EstimatesClient
                initialEstimates={estimates}
                initialPage={1}
                initialSearch=""
                initialTotalPages={1}
                eventId={id}
                eventData={{
                  id: event.id,
                  clientId: event.clientId,
                  name: event.name,
                  venue: event.venue,
                  startDate: event.startDate,
                  endDate: event.endDate,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 mt-6">
            {event && (
              <InvoicesClient
                initialInvoices={invoices}
                initialPage={1}
                initialSearch=""
                initialTotalPages={1}
                initialCurrencyCode={currencyCode}
                eventId={id}
                hideEventColumn={true}
                eventData={{
                  id: event.id,
                  clientId: event.clientId,
                  name: event.name,
                  venue: event.venue,
                  startDate: event.startDate,
                  endDate: event.endDate,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="bills" className="space-y-4 mt-6">
            {event && (
              <BillsClient
                initialBills={bills}
                initialPage={1}
                initialSearch=""
                initialTotalPages={1}
                initialCurrencyCode={currencyCode}
                eventId={id}
                hideEventColumn={true}
                eventData={{
                  id: event.id,
                  name: event.name,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <FeedbackTab
              eventId={id}
              eventName={event.name}
              endDate={event.endDate ? new Date(event.endDate) : null}
              rating={event.rating}
              comments={event.comments}
            />
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

      {/* Task Sheet for creating tasks */}
      <TaskSheet
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        eventId={id}
        onSuccess={handleTaskSheetSuccess}
        parentTaskId={parentTaskForCreation?.id}
        inheritedPriority={parentTaskForCreation?.priority}
        inheritedType={parentTaskForCreation?.type}
      />

      {/* Task Edit Dialog */}
      <TaskEditDialog
        open={isTaskEditOpen}
        onOpenChange={setIsTaskEditOpen}
        taskId={selectedTaskId}
        eventId={id}
        isSubtask={isSubtask}
        onCreateSubtask={handleCreateSubtask}
        onSubtaskClick={handleTaskClick}
        onParentTaskClick={handleTaskClick}
        onSuccess={handleTaskEditSuccess}
      />

      {/* Itinerary Sheet for bulk adding itineraries */}
      <ItinerarySheet
        open={isItinerarySheetOpen}
        onOpenChange={setIsItinerarySheetOpen}
        eventId={id}
        eventStartDate={event?.startDate ? new Date(event.startDate) : new Date()}
        eventEndDate={event?.endDate ? new Date(event.endDate) : new Date()}
        onSuccess={handleItinerarySheetSuccess}
      />

      {/* Event Switcher */}
      <EventSwitcher
        open={isSwitcherOpen}
        onOpenChange={setIsSwitcherOpen}
        currentEventId={id}
      />

      {/* Registration Link Confirmation Dialog */}
      <AlertDialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Registration Link</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the event registration link to the client's email address. 
              The client can then share this link with potential guests to allow them to register for the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingRegistration}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendRegistrationLink}
              disabled={isSendingRegistration}
            >
              {isSendingRegistration ? "Sending..." : "Send Link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
