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
import { deleteEstimate } from "../actions";

type DeleteEstimateDialogProps = {
  estimateId: string | null;
  estimateTitle: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function DeleteEstimateDialog({
  estimateId,
  estimateTitle,
  onOpenChange,
  onSuccess,
}: DeleteEstimateDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!estimateId) return;

    startTransition(async () => {
      const result = await deleteEstimate(estimateId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Estimate deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <AlertDialog open={!!estimateId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{estimateTitle}"? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}