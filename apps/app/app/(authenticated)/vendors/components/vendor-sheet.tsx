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
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Badge } from "@repo/design-system/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createVendor, updateVendor } from "../actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteVendorDialog } from "./delete-vendor-dialog";

const vendorFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  serviceIds: z.array(z.string()).optional(),
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

export function VendorSheet({ open, onOpenChange, vendor, mode: initialMode, onSuccess, serviceCategories }: VendorSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
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
                        className="min-h-[80px]"
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Services Provided</FormLabel>
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
                        {serviceCategories.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="serviceIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), category.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== category.id)
                                            );
                                      }}
                                      disabled={isViewing}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {category.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
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

              <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
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
    </>
  );
}
