"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
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
} from "@repo/design-system/components/ui/command";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { createInvoice } from "../actions";
import { getClients } from "../../clients/actions";
import { getEvents } from "../../events/actions";
import { createServiceCategory } from "../../settings/actions";
import { toast } from "sonner";
import { getCurrencyConfig } from "@repo/internationalization/currencies";
import { cn } from "@repo/design-system/lib/utils";
import { Badge } from "@repo/design-system/components/ui/badge";
import type { InvoiceStatus } from "@/lib/invoice-calculations";

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

interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  billTo: string;
  shipTo?: string | null;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  terms?: string | null;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  client?: { name: string; email: string | null; company?: string | null; address?: string | null } | null;
  event?: { id: string; name: string; startDate: string; endDate: string; venue?: string | null } | null;
  lineItems: LineItem[];
  discount?: number | null;
}

interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "view";
  invoice?: Partial<Invoice>; // Make it partial to accept both list and detail views
  onSuccess?: () => void;
  currencyCode?: string;
  serviceCategories: ServiceCategory[];
  eventData?: {
    id: string;
    clientId: string;
    name: string;
    venue?: string | null;
    startDate: Date;
    endDate: Date;
  };
}

const statusColors = {
  UNPAID: "bg-red-500",
  PARTIALLY_PAID: "bg-orange-500",
  PAID: "bg-green-500",
} as const;

const statusLabels = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
} as const;

export function InvoiceSheet({
  open,
  onOpenChange,
  mode,
  invoice,
  onSuccess,
  currencyCode = "USD",
  serviceCategories: initialServiceCategories,
  eventData,
}: InvoiceSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [eventComboboxOpen, setEventComboboxOpen] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServiceCategories);
  const pendingLineItemIndexRef = useRef<number | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string; address: string | null }>>([]);
  const [events, setEvents] = useState<Array<{ id: string; name: string; clientId: string }>>([]);
  const currency = getCurrencyConfig(currencyCode);

  // Form dirty state and confirmation dialog
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ number: false, clientId: false, eventId: false, billTo: false, dueDate: false });

  const [formData, setFormData] = useState({
    number: "",
    clientId: "",
    eventId: "",
    billTo: "",
    shipTo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    poNumber: "",
    paymentTerms: "",
    notes: "",
    terms: "",
    discount: 0,
    lineItems: [
      {
        id: crypto.randomUUID(),
        serviceCategoryId: "",
        description: "",
        quantity: 1,
        unit: "",
        rate: 0,
        tax: 0,
      },
    ] as LineItem[],
  });

  // Reset form when sheet opens
  useEffect(() => {
    if (open && mode === "create") {
      setIsDirty(false);
      setFormData({
        number: "",
        clientId: eventData?.clientId || "",
        eventId: eventData?.id || "",
        billTo: "",
        shipTo: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        poNumber: "",
        paymentTerms: "",
        notes: "",
        terms: "",
        discount: 0,
        lineItems: [
          {
            id: crypto.randomUUID(),
            serviceCategoryId: "",
            description: "",
            quantity: 1,
            unit: "",
            rate: 0,
            tax: 0,
          },
        ],
      });
      setIsDirty(false);
    }
  }, [open, mode, eventData]);

  // Fetch clients and events on mount
  useEffect(() => {
    const fetchData = async () => {
      const [clientsResult, eventsResult] = await Promise.all([getClients(), getEvents()]);

      if (clientsResult.data) {
        setClients(clientsResult.data);
      }

      if (eventsResult.data) {
        setEvents(eventsResult.data);
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

  // Auto-fill billTo when client is selected
  useEffect(() => {
    if (formData.clientId) {
      const selectedClient = clients.find((c) => c.id === formData.clientId);
      if (selectedClient && selectedClient.address) {
        setFormData((prev) => ({ ...prev, billTo: selectedClient.address || "" }));
      }
    }
  }, [formData.clientId, clients]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Don't show cancel confirm if the add service dialog is open
      if (addServiceDialogOpen) {
        return; // Ignore this close attempt
      }
      
      // Check if form is dirty and in create mode
      if (isDirty && mode === "create") {
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
    if (isDirty && mode === "create") {
      setShowCancelConfirm(true);
    } else {
      handleOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset field errors
    setFieldErrors({ number: false, clientId: false, eventId: false, billTo: false, dueDate: false });

    // Validate and mark errors
    const errors = { number: false, clientId: false, eventId: false, billTo: false, dueDate: false };

    if (!formData.number.trim()) {
      errors.number = true;
      toast.error("Invoice number is required");
      setFieldErrors(errors);
      return;
    }

    if (!formData.clientId) {
      errors.clientId = true;
      toast.error("Client is required");
      setFieldErrors(errors);
      return;
    }

    if (!formData.eventId) {
      errors.eventId = true;
      toast.error("Event is required");
      setFieldErrors(errors);
      return;
    }

    if (!formData.billTo.trim()) {
      errors.billTo = true;
      toast.error("Bill to address is required");
      setFieldErrors(errors);
      return;
    }

    if (!formData.dueDate) {
      errors.dueDate = true;
      toast.error("Due date is required");
      setFieldErrors(errors);
      return;
    }

    if (formData.lineItems.length === 0 || formData.lineItems.some((item: LineItem) => !item.description.trim())) {
      toast.error("At least one line item with description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createInvoice({
        number: formData.number,
        clientId: formData.clientId,
        eventId: formData.eventId,
        billTo: formData.billTo,
        shipTo: formData.shipTo || undefined,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        poNumber: formData.poNumber || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        discount: formData.discount || 0,
        lineItems: formData.lineItems,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsDirty(false); // Reset dirty state after successful save
      toast.success("Invoice created successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save invoice. Please try again.");
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
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_: LineItem, i: number) => i !== index),
      }));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item: LineItem, i: number) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum: number, item: LineItem) => {
      return sum + item.quantity * item.rate;
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

    if (subtotal === 0) {
      return 0;
    }

    return formData.lineItems.reduce((sum: number, item: LineItem) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
      return sum + itemAfterDiscount * (item.tax / 100);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax;
  };

  // Filter events by selected client
  const filteredEvents = formData.clientId ? events.filter((e) => e.clientId === formData.clientId) : [];

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-4xl overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing if any sub-dialog is open
          if (addServiceDialogOpen) {
            e.preventDefault();
            return;
          }
          
          // Prevent closing when clicking outside if form is dirty (no dialog, just prevent)
          if (isDirty && mode === "create") {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Create New Invoice" : "View Invoice"}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Fill in the details to create a new invoice." : "Review the invoice details."}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {mode === "view" ? (
            <div className="space-y-6 px-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                  <p className="text-lg font-medium mt-1">{invoice?.number}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="secondary" className={`text-white ${invoice?.status ? statusColors[invoice.status as InvoiceStatus] : ''} mt-1`}>
                    {invoice?.status ? statusLabels[invoice.status as InvoiceStatus] : ''}
                  </Badge>
                </div>
              </div>

              {/* Client & Event */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="mt-1">{invoice?.client?.name || "—"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event</label>
                  <p className="mt-1">{invoice?.event?.name || "—"}</p>
                </div>
              </div>

              {/* Billing Address */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bill To</label>
                  <p className="mt-1 whitespace-pre-wrap">{invoice?.billTo || "—"}</p>
                </div>

                {invoice?.shipTo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ship To</label>
                    <p className="mt-1 whitespace-pre-wrap">{invoice.shipTo}</p>
                  </div>
                )}
              </div>

              {/* Dates & Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                  <p className="mt-1">{invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString("en-US") : "—"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <p className="mt-1">{invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : "—"}</p>
                </div>

                {invoice?.poNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PO Number</label>
                    <p className="mt-1">{invoice.poNumber}</p>
                  </div>
                )}

                {invoice?.paymentTerms && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                    <p className="mt-1">{invoice.paymentTerms}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice?.lineItems?.map((item: LineItem, index: number) => (
                    <div
                      key={item.id}
                      className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 pb-3 border-b last:border-0"
                    >
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground">Service Category</label>
                        <p className="mt-1 text-sm">
                          {serviceCategories.find((cat) => cat.id === item.serviceCategoryId)?.name || "—"}
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

                      <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Rate</label>
                          <p className="mt-1 text-sm">
                            {currency.symbol}
                            {item.rate.toFixed(2)}
                          </p>
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

              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Discount</label>
                  <p className="mt-1">{invoice?.discount || 0}%</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {currency.symbol}
                        {(() => {
                          const subtotal = (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                            return sum + item.quantity * item.rate;
                          }, 0);
                          return subtotal.toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({invoice?.discount || 0}%):</span>
                      <span>
                        -{currency.symbol}
                        {(() => {
                          const subtotal = (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                            return sum + item.quantity * item.rate;
                          }, 0);
                          const discount = subtotal * ((invoice?.discount || 0) / 100);
                          return discount.toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>
                        {currency.symbol}
                        {(() => {
                          const subtotal = (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                            return sum + item.quantity * item.rate;
                          }, 0);
                          const discount = subtotal * ((invoice?.discount || 0) / 100);
                          const subtotalAfterDiscount = subtotal - discount;
                          const tax =
                            subtotal === 0
                              ? 0
                              : (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                                  const itemSubtotal = item.quantity * item.rate;
                                  const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
                                  return sum + itemAfterDiscount * (item.tax / 100);
                                }, 0);
                          return tax.toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>
                        {currency.symbol}
                        {(() => {
                          const subtotal = (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                            return sum + item.quantity * item.rate;
                          }, 0);
                          const discount = subtotal * ((invoice?.discount || 0) / 100);
                          const subtotalAfterDiscount = subtotal - discount;
                          const tax =
                            subtotal === 0
                              ? 0
                              : (invoice?.lineItems || []).reduce((sum: number, item: LineItem) => {
                                  const itemSubtotal = item.quantity * item.rate;
                                  const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
                                  return sum + itemAfterDiscount * (item.tax / 100);
                                }, 0);
                          return (subtotal - discount + tax).toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Amount Paid:</span>
                      <span>
                        {currency.symbol}
                        {invoice?.amountPaid?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-1">
                      <span>Balance Due:</span>
                      <span>
                        {currency.symbol}
                        {invoice?.balanceDue?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              {invoice?.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice?.terms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Terms & Conditions</label>
                  <p className="mt-1 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}

              <SheetFooter className="sticky bottom-0 bg-background border-t pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6 px-6"
              onChange={() => setIsDirty(true)}
            >
              {/* Invoice Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Invoice Number *</label>
                  <Input
                    placeholder="INV-2024-001"
                    value={formData.number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                    required
                    aria-invalid={fieldErrors.number}
                  />
                </div>
              </div>

              {/* Client & Event Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Select Client *</label>
                  <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientComboboxOpen}
                        aria-invalid={fieldErrors.clientId}
                        className="w-full justify-between font-normal"
                        disabled={!!eventData}
                      >
                        {formData.clientId ? (
                          <span>{clients.find((c) => c.id === formData.clientId)?.name || "Select client..."}</span>
                        ) : (
                          <span className="text-muted-foreground">Select client...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    clientId: client.id,
                                    eventId: "", // Reset event selection
                                  }));
                                  setClientComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", formData.clientId === client.id ? "opacity-100" : "opacity-0")}
                                />
                                {client.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Select Event *</label>
                  <Popover open={eventComboboxOpen} onOpenChange={setEventComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={eventComboboxOpen}
                        aria-invalid={fieldErrors.eventId}
                        className="w-full justify-between font-normal"
                        disabled={!formData.clientId || !!eventData}
                      >
                        {formData.eventId ? (
                          <span>{events.find((e) => e.id === formData.eventId)?.name || "Select event..."}</span>
                        ) : (
                          <span className="text-muted-foreground">Select event...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search events..." />
                        <CommandList>
                          <CommandEmpty>No event found.</CommandEmpty>
                          <CommandGroup>
                            {filteredEvents.map((event) => (
                              <CommandItem
                                key={event.id}
                                value={event.name}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    eventId: event.id,
                                  }));
                                  setEventComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", formData.eventId === event.id ? "opacity-100" : "opacity-0")}
                                />
                                {event.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Billing Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Bill To *</label>
                  <Textarea
                    placeholder="Client billing address..."
                    value={formData.billTo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, billTo: e.target.value }))}
                    required
                    rows={3}
                    className="max-h-80"
                    aria-invalid={fieldErrors.billTo}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Ship To</label>
                  <Textarea
                    placeholder="Shipping address (optional)..."
                    value={formData.shipTo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shipTo: e.target.value }))}
                    rows={3}
                    className="max-h-80"
                  />
                </div>
              </div>

              {/* Dates and Other Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Invoice Date *</label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Due Date *</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    required
                    aria-invalid={fieldErrors.dueDate}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">PO Number</label>
                  <Input
                    placeholder="Purchase order number..."
                    value={formData.poNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, poNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Payment Terms</label>
                  <Input
                    placeholder="e.g., Net 30"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  />
                </div>
              </div>

              {/* Line Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.lineItems.map((item: LineItem, index: number) => (
                    <div
                      key={item.id}
                      className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-end border-b pb-4 last:border-0 md:border-0 md:pb-0"
                    >
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
                              updateLineItem(index, "serviceCategoryId", value);
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
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-1">
                        <div>
                          <label className="text-sm font-medium">Qty</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="md:hidden">
                          <label className="text-sm font-medium">Unit</label>
                          <Input placeholder="hrs..." value={item.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)} />
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-1">
                        <label className="text-sm font-medium">Unit</label>
                        <Input placeholder="hrs..." value={item.unit} onChange={(e) => updateLineItem(index, "unit", e.target.value)} />
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
                            onChange={(e) => updateLineItem(index, "rate", Number(e.target.value))}
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
                            onChange={(e) => updateLineItem(index, "tax", Number(e.target.value))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                    className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {currency.symbol}
                        {calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({formData.discount || 0}%):</span>
                      <span>
                        -{currency.symbol}
                        {calculateDiscount().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>
                        {currency.symbol}
                        {calculateTax().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>
                        {currency.symbol}
                        {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Any relevant information..."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="max-h-80"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Terms & Conditions</label>
                  <Textarea
                    placeholder="Payment terms, late fees, etc..."
                    value={formData.terms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="max-h-80"
                  />
                </div>
              </div>

              <SheetFooter className="sticky bottom-0 bg-background border-t pt-4">
                <Button type="button" variant="outline" onClick={handleCancelClick}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Invoice"}
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

    {/* Add Service Category Dialog */}
    <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service Category</DialogTitle>
          <DialogDescription>
            Create a new service category to use in your invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              placeholder="e.g. Catering, Photography, Venue"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddService();
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAddServiceDialogOpen(false);
              setNewServiceName("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddService}
            disabled={!newServiceName.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Service"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
