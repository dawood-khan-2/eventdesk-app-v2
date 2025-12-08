"use client";

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
import { deleteEvent } from "../actions";
import { toast } from "sonner";
import { useState, useTransition } from "react";

interface DeleteEventDialogProps {
  eventId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteEventDialog({ eventId, onOpenChange, onSuccess }: DeleteEventDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!eventId) return;

    startTransition(async () => {
      const result = await deleteEvent(eventId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event deleted successfully");
        onSuccess();
      }
    });
  };

  return (
    <AlertDialog open={!!eventId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the event.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
