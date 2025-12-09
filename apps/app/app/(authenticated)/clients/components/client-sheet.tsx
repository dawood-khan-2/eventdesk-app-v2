"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@repo/design-system/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { Client } from "@repo/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient, updateClient } from "../actions";
import { toast } from "sonner";
import { useTransition, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteClientDialog } from "./delete-client-dialog";

const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
}

export function ClientSheet({ open, onOpenChange, client, mode: initialMode, onSuccess }: ClientSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState(initialMode);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isViewing = mode === "view";
  const isEditing = mode === "edit";
  const isCreating = mode === "create";

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      company: client?.company || "",
      address: client?.address || "",
      notes: client?.notes || "",
    },
  });

  // Reset form when client prop or mode changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name || "",
        email: client?.email || "",
        phone: client?.phone || "",
        company: client?.company || "",
        address: client?.address || "",
        notes: client?.notes || "",
      });
      setMode(initialMode);
    }
  }, [client, open, initialMode, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setMode(initialMode);
    }
    onOpenChange(newOpen);
  };

  const handleEdit = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    if (client) {
      // Close the sheet when canceling edit
      handleOpenChange(false);
    }
  };

  const handleDelete = () => {
    onSuccess();
    onOpenChange(false);
  };

  const onSubmit = (data: ClientFormValues) => {
    startTransition(async () => {
      const result = client
        ? await updateClient({ id: client.id, ...data })
        : await createClient(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(client ? "Client updated successfully" : "Client created successfully");
        form.reset();
        onSuccess();
        if (client) {
          setMode("view");
        }
      }
    });
  };

  const getTitle = () => {
    if (isCreating) return "Create New Client";
    if (isEditing) return "Edit Client";
    return "Client Details";
  };

  const getDescription = () => {
    if (isCreating) return "Fill in the information to create a new client";
    if (isEditing) return "Update the client information below";
    return "View client information";
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {client && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Created At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(client.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Updated At</label>
                    <p className="mt-0.5 text-sm">
                      {new Date(client.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <SheetFooter className="mt-6 flex-col gap-2 sm:flex-col">
                {isViewing && client && (
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
                      {isPending ? "Saving..." : client ? "Update Client" : "Create Client"}
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

      {client && (
        <DeleteClientDialog
          clientId={showDeleteDialog ? client.id : null}
          onOpenChange={setShowDeleteDialog}
          onSuccess={handleDelete}
        />
      )}
    </>
  );
}
