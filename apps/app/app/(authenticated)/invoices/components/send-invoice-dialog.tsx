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

type SendInvoiceDialogProps = {
  invoiceId: string | null;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SendInvoiceDialog({
  invoiceId,
  invoiceNumber,
  clientName,
  clientEmail,
  onOpenChange,
  onConfirm,
}: SendInvoiceDialogProps) {
  return (
    <AlertDialog open={!!invoiceId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send invoice <strong>"{invoiceNumber}"</strong> to <strong>{clientName}</strong> ({clientEmail}
            )?
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
