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
import { deleteBill } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface DeleteBillDialogProps {
  billId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteBillDialog({ billId, onOpenChange, onSuccess }: DeleteBillDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!billId) return;

    startTransition(async () => {
      const result = await deleteBill(billId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Bill deleted successfully");
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={!!billId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bill and all associated
            payment records from your database.
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
