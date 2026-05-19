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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { Lead } from "@repo/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createLead, updateLead } from "../actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteLeadDialog } from "./delete-lead-dialog";

const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "FOLLOW_UP", "CONVERTED", "LOST"]),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
}

export function LeadSheet({ open, onOpenChange, lead, mode: initialMode, onSuccess }: LeadSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isViewing = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      company: lead?.company || "",
      address: lead?.address || "",
      status: lead?.status || "NEW",
      notes: lead?.notes || "",
    },
  });

  // Reset form when lead prop or mode changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: lead?.name || "",
        email: lead?.email || "",
        phone: lead?.phone || "",
        company: lead?.company || "",
        address: lead?.address || "",
        status: lead?.status || "NEW",
        notes: lead?.notes || "",
      });
      setMode(initialMode);
    }
  }, [lead, open, initialMode, form]);

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
    if (lead) {
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

  const onSubmit = (data: LeadFormValues) => {
    startTransition(async () => {
      // When creating a lead, ensure CONVERTED status is not passed
      // (This should not happen due to UI hiding, but adding safety check)
      const submitData = lead 
        ? data 
        : { ...data, status: data.status === "CONVERTED" ? "NEW" : data.status };
      
      const result = lead
        ? await updateLead({ id: lead.id, ...submitData })
        : await createLead(submitData as any);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(lead ? "Lead updated successfully" : "Lead created successfully");
        form.reset();
        onSuccess();
        if (lead) {
          setMode("view");
        }
      }
    });
  };

  const getTitle = () => {
    if (isCreating) return "Create New Lead";
    if (isEditing) return "Edit Lead";
    return "Lead Details";
  };

  const getDescription = () => {
    if (isCreating) return "Fill in the information to create a new lead";
    if (isEditing) return "Update the lead information below";
    return "View lead information";
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent 
          className="overflow-y-auto sm:max-w-xl"
          onInteractOutside={(e) => {
            // Prevent closing if any sub-dialog is open
            if (showDeleteDialog) {
              e.preventDefault();
              return;
            }
            
            // Prevent closing when clicking outside if form is dirty (no dialog, just prevent)
            if (form.formState.isDirty && (isCreating || isEditing)) {
              e.preventDefault();
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
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
                      <Input type="email" placeholder="john@example.com" {...field} disabled={isViewing} />
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
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} disabled={isViewing} />
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
                      <Input placeholder="123 Main St, City, State" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isViewing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                        <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                        {!isCreating && <SelectItem value="CONVERTED">Converted</SelectItem>}
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCreating && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: To mark a lead as converted, create a client instead or use the conversion action.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        className="min-h-[100px] max-h-80"
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {lead && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Created At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Updated At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(lead.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <SheetFooter className="sticky bottom-0 mt-6 flex-col gap-2 bg-background border-t pt-4 sm:flex-col">
                {isViewing && lead && (
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
                      {isPending ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
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

      {lead && (
        <DeleteLeadDialog
          leadId={showDeleteDialog ? lead.id : null}
          onOpenChange={setShowDeleteDialog}
          onSuccess={handleDelete}
        />
      )}
    </>
  );
}
