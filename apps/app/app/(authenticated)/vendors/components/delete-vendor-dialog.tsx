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
import { deleteVendor } from "../actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface DeleteVendorDialogProps {
  vendorId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteVendorDialog({ vendorId, onOpenChange, onSuccess }: DeleteVendorDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!vendorId) return;

    startTransition(async () => {
      const result = await deleteVendor(vendorId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Vendor deleted successfully");
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <AlertDialog open={!!vendorId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the vendor
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
