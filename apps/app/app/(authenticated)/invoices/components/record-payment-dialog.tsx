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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { recordPayment } from "../actions";

type RecordPaymentDialogProps = {
  invoiceId: string | null;
  invoiceNumber: string;
  balanceDue: number;
  currencyCode: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function RecordPaymentDialog({
  invoiceId,
  invoiceNumber,
  balanceDue,
  currencyCode,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState<string>("");

  const handleRecordPayment = () => {
    if (!invoiceId) return;

    const paymentAmount = Number.parseFloat(amount);

    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > balanceDue) {
      toast.error("Payment amount cannot exceed balance due");
      return;
    }

    startTransition(async () => {
      const result = await recordPayment({
        id: invoiceId,
        amount: paymentAmount,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment recorded successfully");
      setAmount("");
      onOpenChange(false);
      onSuccess?.();
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  };

  return (
    <AlertDialog
      open={!!invoiceId}
      onOpenChange={(open) => {
        if (!open) {
          setAmount("");
        }
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the payment amount received for invoice <strong>"{invoiceNumber}"</strong>.
            <br />
            Balance Due: <strong>{formatCurrency(balanceDue)}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Label htmlFor="payment-amount">Payment Amount</Label>
          <Input
            id="payment-amount"
            type="number"
            min="0.01"
            max={balanceDue}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRecordPayment} disabled={isPending}>
            {isPending ? "Recording..." : "Record Payment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
