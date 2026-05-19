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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createVendor, updateVendor } from "../actions";
import { createServiceCategory } from "../../settings/actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState } from "react";
import { Pencil, Trash2, X, Plus } from "lucide-react";
import { DeleteVendorDialog } from "./delete-vendor-dialog";

const vendorFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  serviceIds: z.array(z.string()).min(1, "Please select at least one service"),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

type Vendor = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
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

interface VendorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
  serviceCategories: ServiceCategory[];
}

export function VendorSheet({ open, onOpenChange, vendor, mode: initialMode, onSuccess, serviceCategories: initialServiceCategories }: VendorSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [serviceComboboxOpen, setServiceComboboxOpen] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServiceCategories);

  const isViewing = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      companyName: vendor?.companyName || "",
      contactName: vendor?.contactName || "",
      email: vendor?.email || "",
      phone: vendor?.phone || "",
      address: vendor?.address || "",
      serviceIds: vendor?.services.map((s) => s.service.id) || [],
    },
  });

  // Reset form when vendor prop or mode changes
  useEffect(() => {
    if (open) {
      form.reset({
        companyName: vendor?.companyName || "",
        contactName: vendor?.contactName || "",
        email: vendor?.email || "",
        phone: vendor?.phone || "",
        address: vendor?.address || "",
        serviceIds: vendor?.services.map((s) => s.service.id) || [],
      });
      setMode(initialMode);
    }
  }, [vendor, open, initialMode, form]);

  // Update local service categories when prop changes
  useEffect(() => {
    setServiceCategories(initialServiceCategories);
  }, [initialServiceCategories]);

  const handleAddService = () => {
    startTransition(async () => {
      if (!newServiceName.trim()) return;

      const result = await createServiceCategory({ name: newServiceName.trim() });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Add to local state
        setServiceCategories(prev => [...prev, result.data]);
        
        // Auto-select the newly created service
        const currentServices = form.getValues("serviceIds") || [];
        form.setValue("serviceIds", [...currentServices, result.data.id]);
        
        toast.success("Service category created and selected");
        setNewServiceName("");
        setAddServiceDialogOpen(false);
        setServiceComboboxOpen(false);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Don't show cancel confirm if the add service dialog is open
      if (addServiceDialogOpen) {
        return; // Ignore this close attempt
      }
      
      // Check if form is dirty and in create/edit mode
      if (form.formState.isDirty && (isCreating || isEditing)) {
        setShowCancelConfirm(true);
        return; // Don't close yet
      }
      form.reset();
      setMode(initialMode);
    }
    onOpenChange(newOpen);
  };

  const handleEdit = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    if (vendor) {
      if (form.formState.isDirty) {
        setShowCancelConfirm(true);
      } else {
        handleOpenChange(false);
      }
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    form.reset();
    onOpenChange(false);
    setMode(initialMode);
  };

  const handleCancelClick = () => {
    if (form.formState.isDirty && (isCreating || isEditing)) {
      setShowCancelConfirm(true);
    } else {
      handleOpenChange(false);
    }
  };

  const handleDelete = () => {
    onSuccess();
    onOpenChange(false);
  };

  const onSubmit = (data: VendorFormValues) => {
    startTransition(async () => {
      const result = vendor
        ? await updateVendor({ id: vendor.id, ...data })
        : await createVendor(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(vendor ? "Vendor updated successfully" : "Vendor created successfully");
        form.reset();
        onSuccess();
        if (vendor) {
          setMode("view");
        }
      }
    });
  };

  const getTitle = () => {
    if (isCreating) return "Create New Vendor";
    if (isEditing) return "Edit Vendor";
    return "Vendor Details";
  };

  const getDescription = () => {
    if (isCreating) return "Fill in the information to create a new vendor";
    if (isEditing) return "Update the vendor information below";
    return "View vendor information";
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent 
          className="overflow-y-auto sm:max-w-xl"
          onInteractOutside={(e) => {
            // Prevent closing if any sub-dialog is open
            if (showDeleteDialog || addServiceDialogOpen) {
              e.preventDefault();
              return;
            }
            
            // Prevent closing when clicking outside if form is dirty
            if (form.formState.isDirty && (isCreating || isEditing)) {
              e.preventDefault();
              setShowCancelConfirm(true);
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>{getTitle()}</SheetTitle>
            <SheetDescription>{getDescription()}</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
              <FormField
                control={form.control}
                name="serviceIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Services Provided *</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select the services this vendor provides
                      </p>
                    </div>
                    {isViewing && vendor ? (
                      <div className="flex flex-wrap gap-2">
                        {vendor.services.length > 0 ? (
                          vendor.services.map((service) => (
                            <Badge key={service.id} variant="secondary">
                              {service.service.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No services selected</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Selected Services as Chips */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((serviceId) => {
                              const service = serviceCategories.find(s => s.id === serviceId);
                              if (!service) return null;
                              return (
                                <Badge
                                  key={serviceId}
                                  variant="secondary"
                                  className="pr-1 flex items-center gap-1"
                                >
                                  {service.name}
                                  <button
                                    type="button"
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={() => {
                                      field.onChange(
                                        field.value?.filter((id) => id !== serviceId) || []
                                      );
                                    }}
                                  >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Combobox for Selecting Services */}
                        <Popover open={serviceComboboxOpen} onOpenChange={setServiceComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              type="button"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Select Service
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search services..." />
                              <CommandList>
                                <CommandEmpty>No service found.</CommandEmpty>
                                <CommandGroup>
                                  {serviceCategories
                                    .filter(category => !field.value?.includes(category.id))
                                    .map((category) => (
                                      <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                          field.onChange([...(field.value || []), category.id]);
                                          setServiceComboboxOpen(false);
                                        }}
                                      >
                                        {category.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setServiceComboboxOpen(false);
                                      setAddServiceDialogOpen(true);
                                    }}
                                    className="justify-center text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Service
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Catering Services" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acmecatering.com" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 (555) 000-0000" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main St, City, State, ZIP"
                        className="min-h-[80px] max-h-80"
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {vendor && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Created At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(vendor.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Updated At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(vendor.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <SheetFooter className="sticky bottom-0 mt-6 flex-col gap-2 bg-background border-t pt-4 sm:flex-col">
                {isViewing && vendor && (
                  <>
                    <div className="flex w-full gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={handleEdit}>
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
                    <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenChange(false)}>
                      Close
                    </Button>
                  </>
                )}

                {(isEditing || isCreating) && (
                  <>
                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                      {isPending ? "Saving..." : vendor ? "Update Vendor" : "Create Vendor"}
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
          </Form>
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

      {vendor && (
        <DeleteVendorDialog
          vendorId={showDeleteDialog ? vendor.id : null}
          onOpenChange={setShowDeleteDialog}
          onSuccess={handleDelete}
        />
      )}

      {/* Add Service Dialog */}
      <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
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
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewServiceName("");
                  setAddServiceDialogOpen(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !newServiceName.trim()}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
