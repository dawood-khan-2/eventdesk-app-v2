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
import { deleteClient } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface DeleteClientDialogProps {
  clientId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteClientDialog({ clientId, onOpenChange, onSuccess }: DeleteClientDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!clientId) return;

    startTransition(async () => {
      const result = await deleteClient(clientId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client deleted successfully");
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={!!clientId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the client
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
