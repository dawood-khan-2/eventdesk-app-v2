"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";

type PaymentRecord = {
  id: string;
  amount: number;
  paymentDate: Date | string;
  referenceNumber?: string | null;
  paymentMode: {
    name: string;
  };
};

type ViewPaymentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  paymentRecords: PaymentRecord[];
  currencyCode?: string;
};

export function ViewPaymentsDialog({
  open,
  onOpenChange,
  invoiceNumber,
  paymentRecords,
  currencyCode = "USD",
}: ViewPaymentsDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            Payment records for invoice <strong>{invoiceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {paymentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.paymentDate)}</TableCell>
                    <TableCell>{record.paymentMode.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.referenceNumber || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(record.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
