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

type SendEstimateDialogProps = {
  estimateId: string | null;
  estimateTitle: string;
  clientName: string;
  clientEmail: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SendEstimateDialog({
  estimateId,
  estimateTitle,
  clientName,
  clientEmail,
  onOpenChange,
  onConfirm,
}: SendEstimateDialogProps) {
  return (
    <AlertDialog open={!!estimateId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Estimate</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send the estimate <strong>"{estimateTitle}"</strong> to{" "}
            <strong>{clientName}</strong> ({clientEmail}) for approval?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Send</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
