"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { Pencil, Trash2, MoreVertical, Eye, Calendar, ReceiptIcon } from "lucide-react";
import { DeleteBillDialog } from "./delete-bill-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { ViewPaymentsDialog } from "./view-payments-dialog";
import { useState } from "react";

type Bill = {
  id: string;
  number: string;
  vendorId: string;
  serviceCategoryId: string;
  eventId: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  attachmentUrl?: string | null;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  amountPaid: number;
  balanceDue: number;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    companyName: string;
    contactName: string | null;
    email: string | null;
  };
  serviceCategory: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
  };
  paymentRecords: Array<{
    id: string;
    amount: number;
    paymentDate: Date;
    referenceNumber: string | null;
    paymentMode: {
      name: string;
    };
  }>;
};

interface BillsTableProps {
  bills: Bill[];
  isLoading: boolean;
  onBillClick: (bill: Bill) => void;
  onEditClick: (bill: Bill) => void;
  onDeleteSuccess: () => void;
  currencyCode?: string;
  hideEventColumn?: boolean;
}

export function BillsTable({
  bills,
  isLoading,
  onBillClick,
  onEditClick,
  onDeleteSuccess,
  currencyCode = "USD",
  hideEventColumn = false,
}: BillsTableProps) {
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [recordPaymentBill, setRecordPaymentBill] = useState<Bill | null>(null);
  const [viewPaymentsBill, setViewPaymentsBill] = useState<Bill | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const getStatusBadge = (status: "UNPAID" | "PARTIALLY_PAID" | "PAID") => {
    return (
      <Badge variant="secondary" className={`text-white whitespace-nowrap ${statusColors[status]}`}>
        {statusLabels[status]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="flex flex-col gap-3 md:hidden">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Loading */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Service</TableHead>
                {!hideEventColumn && <TableHead>Event</TableHead>}
                <TableHead>Bill Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  {!hideEventColumn && (
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No bills found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {bills.map((bill) => (
          <Card
            key={bill.id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => onBillClick(bill)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{bill.number}</h3>
                    {getStatusBadge(bill.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{bill.vendor.companyName}</p>
                  <p className="text-xs text-muted-foreground">{bill.serviceCategory.name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(bill);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecordPaymentBill(bill);
                      }}
                      disabled={bill.status === "PAID"}
                    >
                      <ReceiptIcon className="h-4 w-4 mr-2" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewPaymentsBill(bill);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Payments
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteBillId(bill.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1 text-sm mb-3">
                {!hideEventColumn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span>{bill.event.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatCurrency(bill.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due:</span>
                  <span>{formatDate(bill.dueDate)}</span>
                </div>
                {bill.status !== "UNPAID" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(bill.balanceDue)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Service</TableHead>
              {!hideEventColumn && <TableHead>Event</TableHead>}
              <TableHead>Bill Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow
                key={bill.id}
                className="cursor-pointer"
                onClick={() => onBillClick(bill)}
              >
                <TableCell className="font-medium">{bill.number}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{bill.vendor.companyName}</div>
                    {bill.vendor.contactName && (
                      <div className="text-xs text-muted-foreground">
                        {bill.vendor.contactName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{bill.serviceCategory.name}</TableCell>
                {!hideEventColumn && <TableCell>{bill.event.name}</TableCell>}
                <TableCell>{formatDate(bill.billDate)}</TableCell>
                <TableCell>{formatDate(bill.dueDate)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCurrency(bill.amount)}</div>
                    {bill.status !== "UNPAID" && (
                      <div className="text-xs text-muted-foreground">
                        Bal: {formatCurrency(bill.balanceDue)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(bill.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(bill);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordPaymentBill(bill);
                        }}
                        disabled={bill.status === "PAID"}
                      >
                        <ReceiptIcon className="mr-2 h-4 w-4" />
                        Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewPaymentsBill(bill);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Payments
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteBillId(bill.id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteBillDialog
        billId={deleteBillId}
        onOpenChange={(open: boolean) => !open && setDeleteBillId(null)}
        onSuccess={onDeleteSuccess}
      />

      {recordPaymentBill && (
        <RecordPaymentDialog
          billId={recordPaymentBill.id}
          billNumber={recordPaymentBill.number}
          balanceDue={recordPaymentBill.balanceDue}
          currencyCode={currencyCode}
          onOpenChange={(open) => !open && setRecordPaymentBill(null)}
          onSuccess={() => {
            setRecordPaymentBill(null);
            onDeleteSuccess(); // Refresh bills
          }}
        />
      )}

      {viewPaymentsBill && (
        <ViewPaymentsDialog
          open={!!viewPaymentsBill}
          onOpenChange={(open) => !open && setViewPaymentsBill(null)}
          billNumber={viewPaymentsBill.number}
          paymentRecords={viewPaymentsBill.paymentRecords}
          currencyCode={currencyCode}
        />
      )}
    </>
  );
}
