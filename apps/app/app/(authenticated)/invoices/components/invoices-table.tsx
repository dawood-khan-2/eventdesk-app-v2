"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  MoreVerticalIcon,
  TrashIcon,
  CalendarIcon,
  SendIcon,
  ReceiptIcon,
  EyeIcon,
} from "lucide-react";
import { useState } from "react";
import { DeleteInvoiceDialog } from "./delete-invoice-dialog";
import { SendInvoiceDialog } from "./send-invoice-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { ViewPaymentsDialog } from "./view-payments-dialog";
import { sendInvoiceEmail } from "../actions";
import { toast } from "sonner";
import type { InvoiceStatus } from "@/lib/invoice-calculations";

type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  billTo: string;
  shipTo?: string | null;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  terms?: string | null;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  client?: { name: string; email: string | null } | null;
  event?: { name: string } | null;
  lineItems: any[];
  discount?: number | null;
  paymentRecords?: Array<{
    id: string;
    amount: number;
    paymentDate: Date | string;
    referenceNumber?: string | null;
    paymentMode: { name: string };
  }>;
};

type InvoicesTableProps = {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  isLoading?: boolean;
  currencyCode?: string;
  onUpdate?: () => void;
  hideEventColumn?: boolean;
};

const statusColors = {
  UNPAID: "bg-red-500",
  PARTIALLY_PAID: "bg-orange-500",
  PAID: "bg-green-500",
} as const;

const statusLabels = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
} as const;

function calculateTotal(lineItems: any[], discount: number = 0): number {
  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.rate;
  }, 0);

  // Calculate discount amount
  const discountAmount = subtotal * (discount / 100);

  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;

  // Calculate tax on discounted amount
  const tax =
    subtotal === 0
      ? 0
      : lineItems.reduce((sum, item) => {
          const itemSubtotal = item.quantity * item.rate;
          const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
          return sum + itemAfterDiscount * (item.tax / 100);
        }, 0);

  // Return total: subtotal - discount + tax
  return subtotal - discountAmount + tax;
}

function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  if (status === "PAID") return false;
  return new Date(dueDate) < new Date();
}

export function InvoicesTable({
  invoices,
  onView,
  isLoading = false,
  currencyCode = "USD",
  onUpdate,
  hideEventColumn = false,
}: InvoicesTableProps) {
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deleteInvoiceNumber, setDeleteInvoiceNumber] = useState("");
  const [sendInvoiceId, setSendInvoiceId] = useState<string | null>(null);
  const [sendInvoiceNumber, setSendInvoiceNumber] = useState("");
  const [sendClientName, setSendClientName] = useState("");
  const [sendClientEmail, setSendClientEmail] = useState("");
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentInvoiceNumber, setPaymentInvoiceNumber] = useState("");
  const [paymentBalanceDue, setPaymentBalanceDue] = useState(0);

  const [viewPaymentsOpen, setViewPaymentsOpen] = useState(false);
  const [viewPaymentsInvoiceNumber, setViewPaymentsInvoiceNumber] = useState("");
  const [viewPaymentsRecords, setViewPaymentsRecords] = useState<Invoice['paymentRecords']>([]);

  const handleDelete = (invoice: Invoice) => {
    setDeleteInvoiceId(invoice.id);
    setDeleteInvoiceNumber(invoice.number);
  };

  const handleSend = (invoice: Invoice) => {
    const clientName = invoice.client?.name || "Unknown";
    const clientEmail = invoice.client?.email || "No email";

    setSendInvoiceId(invoice.id);
    setSendInvoiceNumber(invoice.number);
    setSendClientName(clientName);
    setSendClientEmail(clientEmail);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setPaymentInvoiceId(invoice.id);
    setPaymentInvoiceNumber(invoice.number);
    setPaymentBalanceDue(invoice.balanceDue);
  };

  const handleViewPayments = (invoice: Invoice) => {
    setViewPaymentsInvoiceNumber(invoice.number);
    setViewPaymentsRecords(invoice.paymentRecords || []);
    setViewPaymentsOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!sendInvoiceId) return;

    try {
      const result = await sendInvoiceEmail(sendInvoiceId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Invoice sent successfully!");

      // Close dialog
      setSendInvoiceId(null);
      setSendInvoiceNumber("");
      setSendClientName("");
      setSendClientEmail("");

      // Trigger data refresh
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to send invoice. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading Skeleton */}
        <div className="space-y-4 md:hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Loading Skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                {!hideEventColumn && <TableHead>Event</TableHead>}
                <TableHead>Total</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  {!hideEventColumn && (
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No invoices found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {invoices.map((invoice) => {
          const overdue = isOverdue(invoice.dueDate, invoice.status);
          const total = calculateTotal(invoice.lineItems, invoice.discount || 0);

          return (
            <Card
              key={invoice.id}
              className={`cursor-pointer hover:shadow-md ${overdue ? "border-red-500" : ""}`}
            >
              <CardContent className="p-4" onClick={() => onView(invoice)}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className={`font-medium ${overdue ? "text-red-600" : ""}`}>
                        {invoice.number}
                      </p>
                      {invoice.client && (
                        <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
                      )}
                      {invoice.event && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {invoice.event.name}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordPayment(invoice);
                          }}
                        >
                          <ReceiptIcon className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPayments(invoice);
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend(invoice);
                          }}
                        >
                          <SendIcon className="mr-2 h-4 w-4" />
                          Send
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(invoice);
                          }}
                          disabled={invoice.status !== "UNPAID"}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className={`text-muted-foreground ${overdue ? "text-red-600" : ""}`}>
                        Due: {new Date(invoice.dueDate).toLocaleDateString("en-US")}
                      </p>
                      <p className="font-semibold">Balance: {formatCurrency(invoice.balanceDue, currencyCode)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="secondary" className={`text-white ${statusColors[invoice.status]}`}>
                        {statusLabels[invoice.status]}
                      </Badge>
                      <p className="font-semibold">{formatCurrency(total, currencyCode)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              {!hideEventColumn && <TableHead>Event</TableHead>}
              <TableHead>Total</TableHead>
              <TableHead>Balance Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const overdue = isOverdue(invoice.dueDate, invoice.status);
              const total = calculateTotal(invoice.lineItems, invoice.discount || 0);

              return (
                <TableRow
                  key={invoice.id}
                  className={`cursor-pointer hover:bg-muted/50 ${overdue ? "bg-red-50" : ""}`}
                  onClick={() => onView(invoice)}
                >
                  <TableCell className={`font-medium ${overdue ? "text-red-600" : ""}`}>
                    {invoice.number}
                  </TableCell>
                  <TableCell>
                    {invoice.client ? (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">{invoice.client.name}</div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {!hideEventColumn && (
                    <TableCell>
                      {invoice.event ? (
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {invoice.event.name}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-semibold">{formatCurrency(total, currencyCode)}</TableCell>
                  <TableCell className={`font-semibold ${overdue ? "text-red-600" : ""}`}>
                    {formatCurrency(invoice.balanceDue, currencyCode)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-white ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className={overdue ? "text-red-600" : ""}>
                    {new Date(invoice.dueDate).toLocaleDateString("en-US")}
                    {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordPayment(invoice);
                          }}
                        >
                          <ReceiptIcon className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPayments(invoice);
                          }}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend(invoice);
                          }}
                        >
                          <SendIcon className="mr-2 h-4 w-4" />
                          Send
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(invoice);
                          }}
                          disabled={invoice.status !== "UNPAID"}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DeleteInvoiceDialog
        invoiceId={deleteInvoiceId}
        invoiceNumber={deleteInvoiceNumber}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDeleteInvoiceId(null);
            setDeleteInvoiceNumber("");
          }
        }}
        onSuccess={onUpdate}
      />

      <SendInvoiceDialog
        invoiceId={sendInvoiceId}
        invoiceNumber={sendInvoiceNumber}
        clientName={sendClientName}
        clientEmail={sendClientEmail}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSendInvoiceId(null);
            setSendInvoiceNumber("");
            setSendClientName("");
            setSendClientEmail("");
          }
        }}
        onConfirm={handleConfirmSend}
      />

      <RecordPaymentDialog
        invoiceId={paymentInvoiceId}
        invoiceNumber={paymentInvoiceNumber}
        balanceDue={paymentBalanceDue}
        currencyCode={currencyCode}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setPaymentInvoiceId(null);
            setPaymentInvoiceNumber("");
            setPaymentBalanceDue(0);
          }
        }}
        onSuccess={onUpdate}
      />

      <ViewPaymentsDialog
        open={viewPaymentsOpen}
        onOpenChange={setViewPaymentsOpen}
        invoiceNumber={viewPaymentsInvoiceNumber}
        paymentRecords={viewPaymentsRecords || []}
        currencyCode={currencyCode}
      />
    </>
  );
}
