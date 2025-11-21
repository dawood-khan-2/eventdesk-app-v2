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
import { deleteLead } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface DeleteLeadDialogProps {
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteLeadDialog({ leadId, onOpenChange, onSuccess }: DeleteLeadDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!leadId) return;

    startTransition(async () => {
      const result = await deleteLead(leadId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lead deleted successfully");
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={!!leadId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the lead
            from your database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
