"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@repo/design-system/components/ui/sheet";
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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { CalendarIcon, Check, ChevronsUpDown, Pencil, ArrowRight, Plus } from "lucide-react";
import { createEvent, updateEvent, getEstimatesForLeadOrClient } from "../actions";
import { getClients } from "../../clients/actions";
import { getLeads } from "../../leads/actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { UpgradeDialog } from "./upgrade-dialog";
import { CreateClientDialog } from "../../estimates/components/create-client-dialog";

interface EventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
}

export function EventSheet({ open, onOpenChange, event, mode: initialMode, onSuccess }: EventSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState("");
  const [leadOrClientId, setLeadOrClientId] = useState("");
  const [leadOrClientType, setLeadOrClientType] = useState<"lead" | "client">("client");
  const [estimateId, setEstimateId] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("");
  const [maxGuests, setMaxGuests] = useState<string>("");
  const [registrationEndDate, setRegistrationEndDate] = useState<Date | undefined>();
  const [registrationEndTime, setRegistrationEndTime] = useState("");
  
  // Upgrade dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  
  // Form dirty state and confirmation dialog
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: false, leadOrClientId: false, startDate: false, endDate: false });
  
  // Dropdowns state
  const [leads, setLeads] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [estimates, setEstimates] = useState<Array<{ id: string; title: string; eventName: string | null; eventVenue: string | null; eventStartDate: Date | null; eventEndDate: Date | null }>>([]);
  
  const [leadClientOpen, setLeadClientOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);

  const isViewing = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  // Fetch leads and clients on mount
  useEffect(() => {
    const fetchData = async () => {
      const [leadsResult, clientsResult] = await Promise.all([
        getLeads(),
        getClients(),
      ]);
      
      if (leadsResult.data) {
        // Filter out CONVERTED leads
        setLeads(leadsResult.data.filter((lead: any) => lead.status !== "CONVERTED"));
      }
      
      if (clientsResult.data) {
        setClients(clientsResult.data);
      }
    };
    
    fetchData();
  }, []);

  // Fetch estimates when lead/client is selected
  useEffect(() => {
    if (leadOrClientId && leadOrClientType && !isViewing) {
      startTransition(async () => {
        const result = await getEstimatesForLeadOrClient(leadOrClientId, leadOrClientType);
        if (result.data) {
          setEstimates(result.data);
        }
      });
    } else {
      setEstimates([]);
      setEstimateId("");
    }
  }, [leadOrClientId, leadOrClientType, isViewing]);

  // Pre-fill event details when estimate is selected
  useEffect(() => {
    if (estimateId && estimates.length > 0) {
      const estimate = estimates.find(e => e.id === estimateId);
      if (estimate) {
        if (estimate.eventName) setName(estimate.eventName);
        if (estimate.eventVenue) setVenue(estimate.eventVenue);
        if (estimate.eventStartDate) {
          const start = new Date(estimate.eventStartDate);
          setStartDate(start);
          setStartTime(format(start, "HH:mm"));
        }
        if (estimate.eventEndDate) {
          const end = new Date(estimate.eventEndDate);
          setEndDate(end);
          setEndTime(format(end, "HH:mm"));
        }
      }
    }
  }, [estimateId, estimates]);

  // Reset form when event prop or mode changes
  useEffect(() => {
    if (open) {
      setIsDirty(false); // Reset dirty state when opening
      if (event) {
        setName(event.name || "");
        setLeadOrClientId(event.clientId || "");
        setLeadOrClientType("client");
        setEstimateId("");
        setVenue(event.venue || "");
        setDescription(event.description || "");
        setMaxGuests(event.maxGuests ? event.maxGuests.toString() : "");
        
        if (event.startDate) {
          const start = new Date(event.startDate);
          setStartDate(start);
          setStartTime(format(start, "HH:mm"));
        }
        if (event.endDate) {
          const end = new Date(event.endDate);
          setEndDate(end);
          setEndTime(format(end, "HH:mm"));
        }
        if (event.registrationEndDate) {
          const regEnd = new Date(event.registrationEndDate);
          setRegistrationEndDate(regEnd);
          setRegistrationEndTime(format(regEnd, "HH:mm"));
        } else {
          setRegistrationEndDate(undefined);
          setRegistrationEndTime("");
        }
      } else {
        setName("");
        setLeadOrClientId("");
        setLeadOrClientType("client");
        setEstimateId("");
        setVenue("");
        setDescription("");
        setStartDate(undefined);
        setStartTime("00:00");
        setEndDate(undefined);
        setEndTime("00:00");
        setMaxGuests("");
        setRegistrationEndDate(undefined);
        setRegistrationEndTime("");
      }
      setMode(initialMode);
    }
  }, [event, open, initialMode]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Check if form is dirty and in create/edit mode
      if (isDirty && (isCreating || isEditing)) {
        setShowCancelConfirm(true);
        return; // Don't close yet
      }
      setMode(initialMode);
    }
    onOpenChange(newOpen);
  };

  const handleEdit = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    if (event) {
      if (isDirty) {
        setShowCancelConfirm(true);
      } else {
        handleOpenChange(false);
      }
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setIsDirty(false);
    onOpenChange(false);
    setMode(initialMode);
  };

  const handleCancelClick = () => {
    if (isDirty && (isCreating || isEditing)) {
      setShowCancelConfirm(true);
    } else {
      if (isEditing) {
        handleOpenChange(false);
      } else {
        handleOpenChange(false);
      }
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset field errors
    setFieldErrors({ name: false, leadOrClientId: false, startDate: false, endDate: false });
    
    // Validation
    const errors = { name: false, leadOrClientId: false, startDate: false, endDate: false };
    
    if (!name.trim()) {
      errors.name = true;
      toast.error("Event name is required");
      setFieldErrors(errors);
      return;
    }
    
    if (!leadOrClientId) {
      errors.leadOrClientId = true;
      toast.error("Please select a lead or client");
      setFieldErrors(errors);
      return;
    }
    
    if (!startDate) {
      errors.startDate = true;
      toast.error("Start date is required");
      setFieldErrors(errors);
      return;
    }
    
    if (!endDate) {
      errors.endDate = true;
      toast.error("End date is required");
      setFieldErrors(errors);
      return;
    }
    
    // Use default time in create mode if not provided
    const finalStartTime = startTime || "00:00";
    const finalEndTime = endTime || "00:00";

    // Combine date and time
    const startDateTime = new Date(startDate);
    const [startHour, startMinute] = finalStartTime.split(":");
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const endDateTime = new Date(endDate);
    const [endHour, endMinute] = finalEndTime.split(":");
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Validate dates
    if (startDateTime > endDateTime) {
      toast.error("End date/time must be after or equal to start date/time");
      return;
    }

    startTransition(async () => {
      // Prepare registration end date/time if provided
      let registrationEndDateTime: Date | undefined;
      if (registrationEndDate && registrationEndTime) {
        registrationEndDateTime = new Date(registrationEndDate);
        const [regHour, regMinute] = registrationEndTime.split(":");
        registrationEndDateTime.setHours(parseInt(regHour), parseInt(regMinute), 0, 0);
      }

      const data = {
        name: name.trim(),
        leadOrClientId,
        leadOrClientType,
        estimateId: estimateId || undefined,
        venue: venue.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
        registrationEndDate: registrationEndDateTime?.toISOString(),
      };

      const result = event
        ? await updateEvent({ id: event.id, ...data })
        : await createEvent(data);

      if (result.error) {
        // Check if it's a subscription limit error
        if (result.error.includes("Upgrade to Pro")) {
          setUpgradeMessage(result.error);
          setUpgradeDialogOpen(true);
        } else {
          toast.error(result.error);
        }
      } else {
        setIsDirty(false); // Reset dirty state after successful save
        toast.success(event ? "Event updated successfully" : "Event created successfully");
        onSuccess();
        if (event) {
          setMode("view");
        } else if (result.data) {
          // Redirect to newly created event's manage page
          router.push(`/events/${result.data.id}`);
        }
      }
    });
  };

  const getTitle = () => {
    if (isCreating) return "Create New Event";
    if (isEditing) return "Edit Event";
    return "Event Details";
  };

  const getDescription = () => {
    if (isCreating) return "Fill in the information to create a new event";
    if (isEditing) return "Update the event information below";
    return "View event information";
  };

  const selectedLeadClient = leadOrClientType === "lead"
    ? leads.find(l => l.id === leadOrClientId)
    : clients.find(c => c.id === leadOrClientId);

  const selectedEstimate = estimates.find(e => e.id === estimateId);

  const handleClientCreated = (clientId: string, clientName: string) => {
    // Add to local state
    setClients(prev => [...prev, { id: clientId, name: clientName, email: null }]);

    // Auto-select the new client
    setLeadOrClientId(clientId);
    setLeadOrClientType("client");

    // Toast already shown by dialog
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent 
          className="overflow-y-auto sm:max-w-xl"
          onInteractOutside={(e) => {
            // Prevent closing if any sub-dialog is open
            if (createClientDialogOpen || upgradeDialogOpen) {
              e.preventDefault();
              return;
            }
            
            // Prevent closing when clicking outside if form is dirty (no dialog, just prevent)
            if (isDirty && (isCreating || isEditing)) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>{getTitle()}</SheetTitle>
            <SheetDescription>{getDescription()}</SheetDescription>
          </SheetHeader>

          <form 
            onSubmit={onSubmit} 
            className="space-y-4 px-6 py-6"
            onChange={() => {
              if (!isDirty && (isCreating || isEditing)) {
                setIsDirty(true);
              }
            }}
          >
            {/* Lead/Client Selection */}
            <div className="space-y-2">
              <Label>Lead / Client *</Label>
              {isViewing || isEditing ? (
                <Input 
                  value={event?.client?.name || selectedLeadClient?.name || ""} 
                  disabled 
                />
              ) : (
                <Popover open={leadClientOpen} onOpenChange={setLeadClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={leadClientOpen}
                      aria-invalid={fieldErrors.leadOrClientId}
                      className="w-full justify-between font-normal"
                    >
                      {leadOrClientId ? (
                        <span>
                          {(() => {
                            const allItems = [
                              ...leads.map(l => ({ ...l, type: 'lead' as const })),
                              ...clients.map(c => ({ ...c, type: 'client' as const }))
                            ];
                            const selected = allItems.find(item => item.id === leadOrClientId);
                            return selected ? (
                              <>
                                {selected.name}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  [{selected.type === 'lead' ? 'Lead' : 'Client'}]
                                </span>
                              </>
                            ) : "Select lead or client...";
                          })()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Select lead or client...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search leads and clients..." />
                      <CommandList className="max-h-[300px] overflow-y-auto">
                        <CommandEmpty>
                          <div className="py-6 text-center">
                            <p className="mb-4 text-sm text-muted-foreground">No client found.</p>
                            <div className="px-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setLeadClientOpen(false);
                                  setCreateClientDialogOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Client
                              </Button>
                            </div>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setLeadClientOpen(false);
                              setCreateClientDialogOpen(true);
                            }}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Client
                          </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        {leads.length > 0 && (
                          <CommandGroup heading="Leads">
                            {leads.map((lead) => (
                              <CommandItem
                                key={lead.id}
                                value={lead.name}
                                onSelect={() => {
                                  setLeadOrClientId(lead.id);
                                  setLeadOrClientType('lead');
                                  setLeadClientOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    leadOrClientId === lead.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{lead.name}</span>
                                  {lead.email && (
                                    <span className="text-xs text-muted-foreground">{lead.email}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {clients.length > 0 && (
                          <CommandGroup heading="Clients">
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setLeadOrClientId(client.id);
                                  setLeadOrClientType('client');
                                  setLeadClientOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    leadOrClientId === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{client.name}</span>
                                  {client.email && (
                                    <span className="text-xs text-muted-foreground">{client.email}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Estimate Selection (optional) */}
            {!isViewing && !isEditing && leadOrClientId && (
              <div className="space-y-2">
                <Label>Estimate (optional)</Label>
                <Popover open={estimateOpen} onOpenChange={setEstimateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={estimateOpen}
                      className="w-full justify-between"
                      disabled={!estimates.length}
                    >
                      {selectedEstimate?.title || "Select estimate..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search estimates..." />
                      <CommandList>
                        <CommandEmpty>No estimate found.</CommandEmpty>
                        <CommandGroup>
                          {estimates.map((estimate) => (
                            <CommandItem
                              key={estimate.id}
                              value={estimate.title}
                              onSelect={() => {
                                setEstimateId(estimate.id);
                                setEstimateOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  estimateId === estimate.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div>{estimate.title}</div>
                                {estimate.eventName && (
                                  <div className="text-xs text-muted-foreground">{estimate.eventName}</div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                placeholder="Annual Gala"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isViewing}
                aria-invalid={fieldErrors.name}
              />
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="Grand Ballroom"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                disabled={isViewing}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event details..."
                className="min-h-[100px] max-h-80"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isViewing}
              />
            </div>

            {/* Guest Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  disabled={isViewing}
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !registrationEndDate && "text-muted-foreground"
                      )}
                      disabled={isViewing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {registrationEndDate ? format(registrationEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={registrationEndDate}
                      onSelect={setRegistrationEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {registrationEndDate && (
              <div className="space-y-2">
                <Label htmlFor="registrationEndTime">Registration Deadline Time</Label>
                <Input
                  id="registrationEndTime"
                  type="time"
                  value={registrationEndTime}
                  onChange={(e) => setRegistrationEndTime(e.target.value)}
                  disabled={isViewing}
                />
              </div>
            )}

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      aria-invalid={fieldErrors.startDate}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={isViewing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {!isCreating && (
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isViewing}
                  />
                </div>
              )}
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      aria-invalid={fieldErrors.endDate}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={isViewing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {!isCreating && (
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isViewing}
                  />
                </div>
              )}
            </div>

            {event && (
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Created At</label>
                  <p className="mt-0.5 text-sm">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Updated At</label>
                  <p className="mt-0.5 text-sm">
                    {new Date(event.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <SheetFooter className="sticky bottom-0 mt-6 flex-col gap-2 bg-background border-t pt-4 sm:flex-col">
              {isViewing && event && (
                <>
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                    Close
                  </Button>
                </>
              )}

              {(isEditing || isCreating) && (
                <>
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Saving..." : event ? "Update Event" : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Confirmation Dialog for Unsaved Changes */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmCancel}>
              Discard Changes
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowCancelConfirm(false)}>
              Continue Editing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <UpgradeDialog 
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        message={upgradeMessage}
      />
      
      {/* Client Creation Dialog */}
      <CreateClientDialog
        open={createClientDialogOpen}
        onOpenChange={setCreateClientDialogOpen}
        onSuccess={handleClientCreated}
      />
    </>
  );
}
