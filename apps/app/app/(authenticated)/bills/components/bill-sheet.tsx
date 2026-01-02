"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@repo/design-system/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createBill, updateBill, uploadBillAttachment } from "../actions";
import { getEvents } from "../../events/actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState, useRef } from "react";
import { Pencil, Trash2, Paperclip, Download, FileText } from "lucide-react";
import { DeleteBillDialog } from "./delete-bill-dialog";

const billFormSchema = z.object({
  number: z.string().min(1, "Bill number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  serviceCategoryId: z.string().min(1, "Service category is required"),
  eventId: z.string().min(1, "Event is required"),
  billDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.string().min(1, "Amount is required"),
});

type BillFormValues = z.infer<typeof billFormSchema>;

type Bill = {
  id: string;
  number: string;
  vendorId: string;
  serviceCategoryId: string;
  eventId: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  attachmentUrl?: string | null;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  amountPaid: number;
  balanceDue: number;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    companyName: string;
    contactName: string | null;
    email: string | null;
  };
  serviceCategory: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
  };
  paymentRecords: any[];
};

type Vendor = {
  id: string;
  companyName: string;
  services: Array<{
    id: string;
    service: {
      id: string;
      name: string;
    };
  }>;
};

type ServiceCategory = {
  id: string;
  name: string;
};

type Event = {
  id: string;
  name: string;
};

interface BillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
  vendors: Vendor[];
  serviceCategories: ServiceCategory[];
  currencyCode?: string;
  eventData?: {
    id: string;
    name: string;
  };
}

export function BillSheet({
  open,
  onOpenChange,
  bill,
  mode: initialMode,
  onSuccess,
  vendors,
  serviceCategories,
  currencyCode = "USD",
  eventData,
}: BillSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredServiceCategories, setFilteredServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileName: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewing = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      number: bill?.number || "",
      vendorId: bill?.vendorId || "",
      serviceCategoryId: bill?.serviceCategoryId || "",
      eventId: bill?.eventId || "",
      billDate: bill?.billDate ? new Date(bill.billDate).toISOString().split("T")[0] : "",
      dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
      amount: bill?.amount ? bill.amount.toString() : "",
    },
  });

  // Load events on mount (only if not in event context)
  useEffect(() => {
    if (!eventData) {
      async function loadEvents() {
        const result = await getEvents({ limit: 1000 });
        if (result.data) {
          setEvents(result.data);
        }
      }
      loadEvents();
    }
  }, [eventData]);

  // Reset form when bill prop or mode changes
  useEffect(() => {
    if (open) {
      form.reset({
        number: bill?.number || "",
        vendorId: bill?.vendorId || "",
        serviceCategoryId: bill?.serviceCategoryId || "",
        eventId: bill?.eventId || eventData?.id || "",
        billDate: bill?.billDate ? new Date(bill.billDate).toISOString().split("T")[0] : "",
        dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
        amount: bill?.amount ? bill.amount.toString() : "",
      });
      setMode(initialMode);

      // Update filtered service categories based on vendor
      if (bill?.vendorId) {
        updateFilteredServiceCategories(bill.vendorId);
      }
    }
  }, [bill, open, initialMode, form]);

  // Watch vendor selection to update service categories
  const selectedVendorId = form.watch("vendorId");
  useEffect(() => {
    if (selectedVendorId) {
      updateFilteredServiceCategories(selectedVendorId);
      // Reset service category if it's not in the filtered list
      const currentServiceCategory = form.getValues("serviceCategoryId");
      const isValidServiceCategory = filteredServiceCategories.some(
        (cat) => cat.id === currentServiceCategory
      );
      if (!isValidServiceCategory && !isViewing) {
        form.setValue("serviceCategoryId", "");
      }
    } else {
      setFilteredServiceCategories([]);
    }
  }, [selectedVendorId]);

  const updateFilteredServiceCategories = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      const vendorServiceCategoryIds = vendor.services.map((s) => s.service.id);
      const filtered = serviceCategories.filter((cat) =>
        vendorServiceCategoryIds.includes(cat.id)
      );
      setFilteredServiceCategories(filtered);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setMode(initialMode);
      setFilteredServiceCategories([]);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onOpenChange(newOpen);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF, PNG, and JPEG files are allowed.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (4.5MB)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 4.5MB limit");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadBillAttachment(formData);

      if (result.error) {
        toast.error(result.error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else if (result.data) {
        setUploadedFile(result.data);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    if (bill) {
      handleOpenChange(false);
    }
  };

  const handleDelete = () => {
    onSuccess();
    onOpenChange(false);
  };

  const onSubmit = (data: BillFormValues) => {
    startTransition(async () => {
      // Only include attachmentUrl if there's a new upload or existing non-null URL
      const attachmentUrl = uploadedFile?.url || (bill?.attachmentUrl ?? undefined);
      
      const payload = {
        ...data,
        amount: Number.parseFloat(data.amount),
        ...(attachmentUrl && { attachmentUrl }),
      };

      const result = bill
        ? await updateBill({ id: bill.id, ...payload })
        : await createBill(payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(bill ? "Bill updated successfully" : "Bill created successfully");
        form.reset();
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess();
        if (bill) {
          setMode("view");
        }
      }
    });
  };

  const getTitle = () => {
    if (isCreating) return "Create New Bill";
    if (isEditing) return "Edit Bill";
    return "Bill Details";
  };

  const getDescription = () => {
    if (isCreating) return "Fill in the information to create a new bill";
    if (isEditing) return "Update the bill information below";
    return "View bill information";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{getTitle()}</SheetTitle>
            <SheetDescription>{getDescription()}</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
              {isViewing && bill ? (
                <>
                  {/* View Mode - Display Only */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Bill Number</label>
                      <p className="mt-1 text-sm">{bill.number}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Vendor</label>
                      <p className="mt-1 text-sm">{bill.vendor.companyName}</p>
                      {bill.vendor.contactName && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {bill.vendor.contactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Service Category</label>
                      <p className="mt-1 text-sm">{bill.serviceCategory.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Event</label>
                      <p className="mt-1 text-sm">{bill.event.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Bill Date</label>
                        <p className="mt-1 text-sm">{formatDate(bill.billDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Due Date</label>
                        <p className="mt-1 text-sm">{formatDate(bill.dueDate)}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <p className="mt-1 text-lg font-semibold">{formatCurrency(bill.amount)}</p>
                    </div>

                    {bill.status !== "UNPAID" && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Amount Paid</label>
                          <p className="mt-1 text-sm text-green-600">
                            {formatCurrency(bill.amountPaid)}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Balance Due</label>
                          <p className="mt-1 text-lg font-semibold text-orange-600">
                            {formatCurrency(bill.balanceDue)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {bill.attachmentUrl && (
                    <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                      <label className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Paperclip className="h-4 w-4" />
                        Attachment
                      </label>
                      <a
                        href={bill.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        <span>
                          {bill.attachmentUrl.split("/").pop()?.split(".")[0]}.
                          {bill.attachmentUrl.split(".").pop()}
                        </span>
                        <Download className="h-3 w-3 ml-auto" />
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3 mt-6">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Created At
                      </label>
                      <p className="mt-0.5 text-sm">
                        {new Date(bill.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Updated At
                      </label>
                      <p className="mt-0.5 text-sm">
                        {new Date(bill.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Create/Edit Mode - Form Fields */}
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="BILL-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedVendorId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  selectedVendorId
                                    ? "Select a service category"
                                    : "Select a vendor first"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredServiceCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event *</FormLabel>
                        {eventData ? (
                          <FormControl>
                            <Input value={eventData.name} disabled />
                          </FormControl>
                        ) : (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an event" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bill Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachment
                      <span className="text-xs text-muted-foreground font-normal">
                        (Optional - PDF, PNG, JPEG, max 4.5MB)
                      </span>
                    </label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={isUploading || isPending}
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <p className="text-xs text-muted-foreground">Uploading...</p>
                    )}
                    {uploadedFile && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 truncate">{uploadedFile.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    )}
                    {!uploadedFile && bill?.attachmentUrl && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 truncate">Current: {bill.attachmentUrl.split("/").pop()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
                {isViewing && bill && (
                  <>
                    <div className="flex w-full gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleEdit}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenChange(false)}
                    >
                      Close
                    </Button>
                  </>
                )}

                {(isEditing || isCreating) && (
                  <>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full sm:w-auto"
                    >
                      {isPending ? "Saving..." : bill ? "Update Bill" : "Create Bill"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isEditing ? handleCancelEdit : () => handleOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {bill && (
        <DeleteBillDialog
          billId={showDeleteDialog ? bill.id : null}
          onOpenChange={setShowDeleteDialog}
          onSuccess={handleDelete}
        />
      )}
    </>
  );
}
