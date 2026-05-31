"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react";
import { recordPayment } from "../actions";
import { getPaymentModes, createPaymentMode } from "../../settings/actions";

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
  const [addPaymentModeDialogOpen, setAddPaymentModeDialogOpen] = useState(false);
  const [newPaymentModeName, setNewPaymentModeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddPaymentMode = () => {
    setIsSubmitting(true);
    
    if (!newPaymentModeName.trim()) {
      setIsSubmitting(false);
      return;
    }

    createPaymentMode({ name: newPaymentModeName.trim() })
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
        } else if (result.data) {
          // Add to local state
          setPaymentModes(prev => [...prev, result.data]);
          
          // Auto-select the newly created payment mode
          setPaymentModeId(result.data.id);
          
          toast.success("Payment mode created and selected");
          setNewPaymentModeName("");
          setAddPaymentModeDialogOpen(false);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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
    <>
    <Dialog
      open={!!invoiceId}
      onOpenChange={(open) => {
        if (!open) {
          // Don't close if the add payment mode dialog is open
          if (addPaymentModeDialogOpen) {
            return;
          }
          setAmount("");
          setPaymentDate(new Date().toISOString().split("T")[0]);
          setReferenceNumber("");
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details for invoice <strong>"{invoiceNumber}"</strong>.
            <br />
            Balance Due: <strong>{formatCurrency(balanceDue)}</strong>
          </DialogDescription>
        </DialogHeader>

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
            <Select 
              value={paymentModeId} 
              onValueChange={(value) => {
                if (value === "add-new") {
                  setAddPaymentModeDialogOpen(true);
                } else {
                  setPaymentModeId(value);
                }
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </SelectItem>
                ))}
                <SelectItem value="add-new" className="text-primary">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    New Payment Mode
                  </div>
                </SelectItem>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment} disabled={isPending}>
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={addPaymentModeDialogOpen} onOpenChange={(open) => {
      setAddPaymentModeDialogOpen(open);
      if (!open) {
        setNewPaymentModeName("");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment Mode</DialogTitle>
          <DialogDescription className="sr-only">Create a new payment mode</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPaymentMode();
          }}
        >
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-mode-name">Payment Mode Name</Label>
              <Input
                id="payment-mode-name"
                placeholder="e.g., Credit Card, Cash, Bank Transfer..."
                value={newPaymentModeName}
                onChange={(e) => setNewPaymentModeName(e.target.value)}
                className="mt-2"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddPaymentModeDialogOpen(false);
                setNewPaymentModeName("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !newPaymentModeName.trim()}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
