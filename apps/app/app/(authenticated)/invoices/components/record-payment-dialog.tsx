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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react";
import { recordPayment } from "../actions";
import { getPaymentModes } from "../../settings/actions";

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
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentModeId, setPaymentModeId] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [paymentModes, setPaymentModes] = useState<{ id: string; name: string }[]>([]);

  // Load payment modes
  useEffect(() => {
    async function loadPaymentModes() {
      const result = await getPaymentModes();
      if (result.data) {
        setPaymentModes(result.data);
        // Auto-select first payment mode if available
        if (result.data.length > 0) {
          setPaymentModeId(result.data[0].id);
        }
      }
    }
    loadPaymentModes();
  }, []);

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

    if (!paymentModeId) {
      toast.error("Please select a payment mode");
      return;
    }

    startTransition(async () => {
      const result = await recordPayment({
        id: invoiceId,
        amount: paymentAmount,
        paymentDate,
        paymentModeId,
        referenceNumber: referenceNumber || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment recorded successfully");
      setAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setReferenceNumber("");
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
          setPaymentDate(new Date().toISOString().split("T")[0]);
          setReferenceNumber("");
        }
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record Payment</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the payment details for invoice <strong>"{invoiceNumber}"</strong>.
            <br />
            Balance Due: <strong>{formatCurrency(balanceDue)}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="payment-date">Payment Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
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

          <div>
            <Label htmlFor="payment-mode">Payment Mode</Label>
            <Select value={paymentModeId} onValueChange={setPaymentModeId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference-number">Reference Number (Optional)</Label>
            <Input
              id="reference-number"
              type="text"
              placeholder="Check #, Transaction ID, etc."
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-2"
            />
          </div>
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
