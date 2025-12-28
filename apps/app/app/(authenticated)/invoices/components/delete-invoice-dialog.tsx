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
import { toast } from "sonner";
import { useTransition } from "react";
import { deleteInvoice } from "../actions";

type DeleteInvoiceDialogProps = {
  invoiceId: string | null;
  invoiceNumber: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNumber,
  onOpenChange,
  onSuccess,
}: DeleteInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!invoiceId) return;

    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Invoice deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <AlertDialog open={!!invoiceId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete invoice "{invoiceNumber}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-500 hover:bg-red-600">
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
