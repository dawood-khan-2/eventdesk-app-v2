"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/design-system/components/ui/sheet";
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
import { Card, CardContent, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/design-system/components/ui/dialog";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { createEstimate, updateEstimate } from "../actions";
import { getClients } from "../../clients/actions";
import { getLeads } from "../../leads/actions";
import { createServiceCategory } from "../../settings/actions";
import { toast } from "sonner";
import { getCurrencyConfig } from "@repo/internationalization/currencies";
import { cn } from "@repo/design-system/lib/utils";
import { CreateLeadDialog } from "./create-lead-dialog";
import { CreateClientDialog } from "./create-client-dialog";

interface LineItem {
  id: string;
  serviceCategoryId: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  tax: number;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface EstimateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "view" | "edit";
  estimate?: any;
  onSuccess?: () => void;
  currencyCode?: string;
  serviceCategories: ServiceCategory[];
  // Event context for auto-fill and freezing
  eventData?: {
    id: string;
    clientId: string;
    name: string;
    venue?: string | null;
    startDate: Date;
    endDate: Date;
  };
}

export function EstimateSheet({ open, onOpenChange, mode, estimate, onSuccess, currencyCode = "USD", serviceCategories: initialServiceCategories, eventData }: EstimateSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [createLeadDialogOpen, setCreateLeadDialogOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServiceCategories);
  const pendingLineItemIndexRef = useRef<number | null>(null);
  const [leads, setLeads] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const currency = getCurrencyConfig(currencyCode);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: estimate?.title || "",
    leadOrClientId: estimate?.leadId || estimate?.clientId || "",
    leadOrClientType: estimate?.leadId ? "lead" : estimate?.clientId ? "client" : "",
    eventName: estimate?.eventName || "",
    eventVenue: estimate?.eventVenue || "",
    eventStartDate: estimate?.eventStartDate || "",
    eventEndDate: estimate?.eventEndDate || "",
    expiryDate: estimate?.expiryDate || "",
    discount: estimate?.discount || 0,
    lineItems: estimate?.lineItems || [{
      id: crypto.randomUUID(),
      serviceCategoryId: "",
      description: "",
      quantity: 1,
      unit: "",
      rate: 0,
      tax: 0,
    }] as LineItem[],
  });

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setIsDirty(false);
      if (mode === "create") {
        setFormData({
          title: "",
          leadOrClientId: eventData?.clientId || "",
          leadOrClientType: eventData?.clientId ? "client" : "",
          eventName: eventData?.name || "",
          eventVenue: eventData?.venue || "",
          eventStartDate: eventData?.startDate ? new Date(eventData.startDate).toISOString().split('T')[0] : "",
          eventEndDate: eventData?.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : "",
          expiryDate: "",
          discount: 0,
          lineItems: [{
            id: crypto.randomUUID(),
            serviceCategoryId: "",
            description: "",
            quantity: 1,
            unit: "",
            rate: 0,
            tax: 0,
          }],
        });
      } else if (estimate) {
        setFormData({
          title: estimate.title || "",
          leadOrClientId: estimate.leadId || estimate.clientId || "",
          leadOrClientType: estimate.leadId ? "lead" : estimate.clientId ? "client" : "",
          eventName: estimate.eventName || "",
          eventVenue: estimate.eventVenue || "",
          eventStartDate: estimate.eventStartDate ? new Date(estimate.eventStartDate).toISOString().split('T')[0] : "",
          eventEndDate: estimate.eventEndDate ? new Date(estimate.eventEndDate).toISOString().split('T')[0] : "",
          expiryDate: estimate.expiryDate ? new Date(estimate.expiryDate).toISOString().split('T')[0] : "",
          discount: estimate.discount || 0,
          lineItems: estimate.lineItems || [{
            id: crypto.randomUUID(),
            serviceCategoryId: "",
            description: "",
            quantity: 1,
            unit: "",
            rate: 0,
            tax: 0,
          }],
        });
      }
    }
  }, [open, mode, estimate, eventData]);

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

  // Update local service categories when prop changes
  useEffect(() => {
    setServiceCategories(initialServiceCategories);
  }, [initialServiceCategories]);

  const handleAddService = () => {
    setIsSubmitting(true);
    
    if (!newServiceName.trim()) {
      setIsSubmitting(false);
      return;
    }

    createServiceCategory({ name: newServiceName.trim() })
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          // Use flushSync to ensure synchronous state updates
          flushSync(() => {
            // Add to local state
            setServiceCategories(prev => [...prev, result.data]);
          });
          
          // Auto-select the newly created service for the pending line item
          if (pendingLineItemIndexRef.current !== null) {
            const lineItemIndex = pendingLineItemIndexRef.current;
            flushSync(() => {
              setFormData(prev => {
                const updated = {
                  ...prev,
                  lineItems: prev.lineItems.map((item: LineItem, i: number) => 
                    i === lineItemIndex ? { ...item, serviceCategoryId: result.data.id } : item
                  )
                };
                return updated;
              });
            });
            setIsDirty(true);
            pendingLineItemIndexRef.current = null;
          }
          
          toast.success("Service category created and selected");
          setNewServiceName("");
          setAddServiceDialogOpen(false);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Don't show cancel confirm if the add service dialog is open
      if (addServiceDialogOpen) {
        return; // Ignore this close attempt
      }
      
      // Check if form is dirty and in create/edit mode
      if (isDirty && (mode === "create" || mode === "edit")) {
        setShowCancelConfirm(true);
        return; // Don't close yet
      }
    }
    onOpenChange(newOpen);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleCancelClick = () => {
    if (isDirty && (mode === "create" || mode === "edit")) {
      setShowCancelConfirm(true);
    } else {
      onOpenChange(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.leadOrClientId || !formData.leadOrClientType) {
      toast.error("Lead or Client is required");
      return;
    }

    if (formData.lineItems.length === 0 || formData.lineItems.some((item: LineItem) => !item.description.trim())) {
      toast.error("At least one line item with description is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (mode === "create") {
        const result = await createEstimate({
          title: formData.title,
          status: "DRAFT",
          leadId: formData.leadOrClientType === "lead" ? formData.leadOrClientId : undefined,
          clientId: formData.leadOrClientType === "client" ? formData.leadOrClientId : undefined,
          eventId: eventData?.id, // Auto-fill eventId from event context
          eventName: formData.eventName || undefined,
          eventVenue: formData.eventVenue || undefined,
          eventStartDate: formData.eventStartDate || undefined,
          eventEndDate: formData.eventEndDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          discount: formData.discount || 0,
          lineItems: formData.lineItems,
        });
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        toast.success("Estimate created successfully!");
        onOpenChange(false);
        onSuccess?.();
      } else if (mode === "edit" && estimate) {
        const result = await updateEstimate({
          id: estimate.id,
          title: formData.title,
          leadId: formData.leadOrClientType === "lead" ? formData.leadOrClientId : undefined,
          clientId: formData.leadOrClientType === "client" ? formData.leadOrClientId : undefined,
          eventName: formData.eventName || undefined,
          eventVenue: formData.eventVenue || undefined,
          eventStartDate: formData.eventStartDate || undefined,
          eventEndDate: formData.eventEndDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          discount: formData.discount || 0,
          lineItems: formData.lineItems,
        });
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        toast.success("Estimate updated successfully!");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to save estimate:", error);
      toast.error("Failed to save estimate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      serviceCategoryId: "",
      description: "",
      quantity: 1,
      unit: "",
      rate: 0,
      tax: 0,
    };
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_: LineItem, i: number) => i !== index)
      }));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item: LineItem, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum: number, item: LineItem) => {
      return sum + (item.quantity * item.rate);
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * ((formData.discount || 0) / 100);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const subtotalAfterDiscount = subtotal - discount;
    
    // If subtotal is 0, return 0 to avoid division by zero
    if (subtotal === 0) {
      return 0;
    }
    
    return formData.lineItems.reduce((sum: number, item: LineItem) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
      return sum + (itemAfterDiscount * (item.tax / 100));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  const handleLeadCreated = (leadId: string, leadName: string) => {
    // Add to local state
    setLeads(prev => [...prev, { id: leadId, name: leadName, email: null }]);

    // Auto-select the new lead
    setFormData(prev => ({
      ...prev,
      leadOrClientId: leadId,
      leadOrClientType: "lead"
    }));

    // Toast already shown by dialog
  };

  const handleClientCreated = (clientId: string, clientName: string) => {
    // Add to local state
    setClients(prev => [...prev, { id: clientId, name: clientName, email: null }]);

    // Auto-select the new client
    setFormData(prev => ({
      ...prev,
      leadOrClientId: clientId,
      leadOrClientType: "client"
    }));

    // Toast already shown by dialog
  };

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-4xl overflow-y-auto"
        onInteractOutside={(e) => {
          // Always prevent closing if the add service dialog is open
          if (addServiceDialogOpen) {
            e.preventDefault();
            return;
          }
          
          // Prevent closing when clicking outside if form is dirty
          if (isDirty && (mode === "create" || mode === "edit")) {
            e.preventDefault();
            setShowCancelConfirm(true);
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Create New Estimate" : 
             mode === "edit" ? "Edit Estimate" : "View Estimate"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Fill in the details to create a new estimate." :
             mode === "edit" ? "Update the estimate details below." :
             "Review the estimate details."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {mode === "view" ? (
            <div className="space-y-6 px-6">
              {/* Estimate Title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estimate Title</label>
                <p className="text-lg font-medium mt-1">{estimate?.title}</p>
              </div>

              {/* Lead/Client */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lead/Client</label>
                <p className="mt-1">
                  {estimate?.client?.name || estimate?.lead?.name || "—"}
                  <span className="ml-2 text-sm text-muted-foreground">
                    [{estimate?.client ? "Client" : estimate?.lead ? "Lead" : "—"}]
                  </span>
                </p>
              </div>

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                    <p className="mt-1">{estimate?.eventName || "—"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Venue</label>
                    <p className="mt-1">{estimate?.eventVenue || "—"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Event Start Date</label>
                      <p className="mt-1">
                        {estimate?.eventStartDate 
                          ? new Date(estimate.eventStartDate).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Event End Date</label>
                      <p className="mt-1">
                        {estimate?.eventEndDate 
                          ? new Date(estimate.eventEndDate).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="mt-1">
                      {estimate?.expiryDate 
                        ? new Date(estimate.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })
                        : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {estimate?.lineItems?.map((item: LineItem, index: number) => (
                    <div key={item.id} className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 pb-3 border-b last:border-0">
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground">Service Category</label>
                        <p className="mt-1 text-sm">
                          {serviceCategories.find(cat => cat.id === item.serviceCategoryId)?.name || "—"}
                        </p>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="mt-1 text-sm">{item.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Qty</label>
                          <p className="mt-1 text-sm">{item.quantity}</p>
                        </div>

                        <div className="md:hidden">
                          <label className="text-sm font-medium text-muted-foreground">Unit</label>
                          <p className="mt-1 text-sm">{item.unit || "—"}</p>
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-1">
                        <label className="text-sm font-medium text-muted-foreground">Unit</label>
                        <p className="mt-1 text-sm">{item.unit || "—"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Rate</label>
                          <p className="mt-1 text-sm">{currency.symbol}{item.rate.toFixed(2)}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tax</label>
                          <p className="mt-1 text-sm">{item.tax}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Discount and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discount</label>
                  <p className="mt-1">{estimate?.discount || 0}%</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currency.symbol}{(() => {
                        const subtotal = (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          return sum + (item.quantity * item.rate);
                        }, 0);
                        return subtotal.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({estimate?.discount || 0}%):</span>
                      <span>-{currency.symbol}{(() => {
                        const subtotal = (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          return sum + (item.quantity * item.rate);
                        }, 0);
                        const discount = subtotal * ((estimate?.discount || 0) / 100);
                        return discount.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{currency.symbol}{(() => {
                        const subtotal = (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          return sum + (item.quantity * item.rate);
                        }, 0);
                        const discount = subtotal * ((estimate?.discount || 0) / 100);
                        const subtotalAfterDiscount = subtotal - discount;
                        const tax = subtotal === 0 ? 0 : (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          const itemSubtotal = item.quantity * item.rate;
                          const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
                          return sum + (itemAfterDiscount * (item.tax / 100));
                        }, 0);
                        return tax.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{currency.symbol}{(() => {
                        const subtotal = (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          return sum + (item.quantity * item.rate);
                        }, 0);
                        const discount = subtotal * ((estimate?.discount || 0) / 100);
                        const subtotalAfterDiscount = subtotal - discount;
                        const tax = subtotal === 0 ? 0 : (estimate?.lineItems || []).reduce((sum: number, item: LineItem) => {
                          const itemSubtotal = item.quantity * item.rate;
                          const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
                          return sum + (itemAfterDiscount * (item.tax / 100));
                        }, 0);
                        return (subtotal - discount + tax).toFixed(2);
                      })()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6 px-6"
              onChange={() => !isDirty && setIsDirty(true)}
            >
              {/* Estimate Title */}
              <div>
                <label className="text-sm font-medium">Estimate Title *</label>
                <Input 
                  placeholder="Enter estimate title..." 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Lead/Client Selector */}
              <div>
                <label className="text-sm font-medium">Select Lead/Client *</label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between font-normal"
                      disabled={!!eventData} // Disable when in event context
                    >
                      {formData.leadOrClientId ? (
                        <span>
                          {(() => {
                            const allItems = [
                              ...leads.map(l => ({ ...l, type: 'lead' as const })),
                              ...clients.map(c => ({ ...c, type: 'client' as const }))
                            ];
                            const selected = allItems.find(item => item.id === formData.leadOrClientId);
                            return selected ? (
                              <>
                                {selected.name}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">
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
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-6 text-center">
                            <p className="mb-4 text-sm text-muted-foreground">No lead or client found.</p>
                            {!eventData && (
                              <div className="space-y-2 px-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setComboboxOpen(false);
                                    setCreateLeadDialogOpen(true);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create New Lead
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setComboboxOpen(false);
                                    setCreateClientDialogOpen(true);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create New Client
                                </Button>
                              </div>
                            )}
                          </div>
                        </CommandEmpty>
                        {leads.length > 0 && (
                          <CommandGroup heading="Leads">
                            {leads.map((lead) => (
                              <CommandItem
                                key={`lead-${lead.id}`}
                                value={`${lead.name} lead`}
                                onSelect={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    leadOrClientId: lead.id,
                                    leadOrClientType: "lead"
                                  }));
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.leadOrClientId === lead.id && formData.leadOrClientType === "lead"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {lead.name}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">[Lead]</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {clients.length > 0 && (
                          <CommandGroup heading="Clients">
                            {clients.map((client) => (
                              <CommandItem
                                key={`client-${client.id}`}
                                value={`${client.name} client`}
                                onSelect={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    leadOrClientId: client.id,
                                    leadOrClientType: "client"
                                  }));
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.leadOrClientId === client.id && formData.leadOrClientType === "client"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {client.name}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">[Client]</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {!eventData && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  setComboboxOpen(false);
                                  setCreateLeadDialogOpen(true);
                                }}
                                className="text-primary"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Lead
                              </CommandItem>
                              <CommandItem
                                onSelect={() => {
                                  setComboboxOpen(false);
                                  setCreateClientDialogOpen(true);
                                }}
                                className="text-primary"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Client
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium">Event Name</label>
                    <Input 
                      placeholder="Enter event name..." 
                      value={formData.eventName}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                      disabled={!!eventData} // Freeze when in event context
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Event Venue</label>
                    <Input 
                      placeholder="Enter event venue..." 
                      value={formData.eventVenue}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventVenue: e.target.value }))}
                      disabled={!!eventData} // Freeze when in event context
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Event Start Date</label>
                      <Input 
                        type="date" 
                        value={formData.eventStartDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventStartDate: e.target.value }))}
                        disabled={!!eventData} // Freeze when in event context
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Event End Date</label>
                      <Input 
                        type="date" 
                        value={formData.eventEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventEndDate: e.target.value }))}
                        disabled={!!eventData} // Freeze when in event context
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Expiry Date</label>
                    <Input 
                      type="date" 
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Services</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.lineItems.map((item: LineItem, index: number) => (
                    <div key={item.id} className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-end border-b pb-4 last:border-0 md:border-0 md:pb-0">
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium">Service Category</label>
                        <Select 
                          key={`select-${item.id}-${item.serviceCategoryId}`}
                          value={item.serviceCategoryId || ""}
                          onValueChange={(value) => {
                            if (value === "add-new") {
                              pendingLineItemIndexRef.current = index;
                              setAddServiceDialogOpen(true);
                            } else {
                              updateLineItem(index, 'serviceCategoryId', value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="add-new" className="text-primary">
                              <div className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-sm font-medium">Description</label>
                        <Input 
                          placeholder="Service description..." 
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1">
                        <div>
                          <label className="text-sm font-medium">Qty</label>
                          <Input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="md:hidden">
                          <label className="text-sm font-medium">Unit</label>
                          <Input 
                            placeholder="hrs..." 
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-1">
                        <label className="text-sm font-medium">Unit</label>
                        <Input 
                          placeholder="hrs..." 
                          value={item.unit}
                          onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-2">
                        <div className="md:col-span-1">
                          <label className="text-sm font-medium">
                            <Link href="/settings?tab=finance" className="hover:underline hover:text-primary">
                              Rate ({currency.symbol})
                            </Link>
                          </label>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateLineItem(index, 'rate', Number(e.target.value))}
                            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="text-sm font-medium">Tax (%)</label>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.tax}
                            onChange={(e) => updateLineItem(index, 'tax', Number(e.target.value))}
                            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end md:col-span-1 md:flex-col md:items-center md:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={formData.lineItems.length <= 1}
                          className="h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Discount and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Discount (%)</label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{currency.symbol}{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({formData.discount || 0}%):</span>
                      <span>-{currency.symbol}{calculateDiscount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{currency.symbol}{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{currency.symbol}{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter>
                <Button type="button" variant="outline" onClick={handleCancelClick}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : mode === "create" ? "Create Estimate" : "Update Estimate"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
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

    {/* Lead Creation Dialog */}
    <CreateLeadDialog
      open={createLeadDialogOpen}
      onOpenChange={setCreateLeadDialogOpen}
      onSuccess={handleLeadCreated}
    />

    {/* Client Creation Dialog */}
    <CreateClientDialog
      open={createClientDialogOpen}
      onOpenChange={setCreateClientDialogOpen}
      onSuccess={handleClientCreated}
    />

    {/* Add Service Dialog */}
    <Dialog open={addServiceDialogOpen} onOpenChange={(open) => {
      setAddServiceDialogOpen(open);
      if (!open) {
        // Clear pending state when dialog is closed
        pendingLineItemIndexRef.current = null;
        setNewServiceName("");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service Category</DialogTitle>
          <DialogDescription className="sr-only">Create a new service category</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddService();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="new-service-name">Service Name</Label>
            <Input
              id="new-service-name"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g., Wedding Planning"
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewServiceName("");
                pendingLineItemIndexRef.current = null;
                setAddServiceDialogOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !newServiceName.trim()}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </>
  );
}