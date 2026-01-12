"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { calculateEstimateTotal } from "../../lib/estimate-helpers";
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
  EditIcon,
  MoreVerticalIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  SendIcon,
} from "lucide-react";
import { useState } from "react";
import { DeleteEstimateDialog } from "./delete-estimate-dialog";
import { SendEstimateDialog } from "./send-estimate-dialog";
import { sendEstimateEmail } from "../actions";
import { toast } from "sonner";

type Estimate = {
  id: string;
  title: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  eventName?: string | null;
  eventVenue?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  createdAt: string;
  client?: { name: string; email: string | null } | null;
  lead?: { name: string; email: string | null } | null;
  lineItems: any[];
  discount?: number | null;
};

type EstimatesTableProps = {
  estimates: Estimate[];
  onEdit: (estimate: Estimate) => void;
  onView: (estimate: Estimate) => void;
  isLoading?: boolean;
  currencyCode?: string;
  onDelete?: () => void;
};

const statusColors = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
  EXPIRED: "bg-orange-500",
} as const;

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
} as const;

const calculateTotal = calculateEstimateTotal;

function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function EstimatesTable({
  estimates,
  onEdit,
  onView,
  isLoading = false,
  currencyCode = "USD",
  onDelete,
}: EstimatesTableProps) {
  const [deleteEstimateId, setDeleteEstimateId] = useState<string | null>(null);
  const [deleteEstimateTitle, setDeleteEstimateTitle] = useState("");
  const [sendEstimateId, setSendEstimateId] = useState<string | null>(null);
  const [sendEstimateTitle, setSendEstimateTitle] = useState("");
  const [sendClientName, setSendClientName] = useState("");
  const [sendClientEmail, setSendClientEmail] = useState("");

  const handleDelete = (estimate: Estimate) => {
    setDeleteEstimateId(estimate.id);
    setDeleteEstimateTitle(estimate.title);
  };

  const handleSend = (estimate: Estimate) => {
    const clientName = estimate.client?.name || estimate.lead?.name || "Unknown";
    const clientEmail = estimate.client?.email || estimate.lead?.email || "No email";
    
    setSendEstimateId(estimate.id);
    setSendEstimateTitle(estimate.title);
    setSendClientName(clientName);
    setSendClientEmail(clientEmail);
  };

  const handleConfirmSend = async () => {
    if (!sendEstimateId) return;
    
    try {
      const result = await sendEstimateEmail(sendEstimateId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success("Estimate sent successfully!");
      
      // Close dialog
      setSendEstimateId(null);
      setSendEstimateTitle("");
      setSendClientName("");
      setSendClientEmail("");

      // Trigger data refresh
      onDelete?.();
    } catch (error) {
      toast.error("Failed to send estimate. Please try again.");
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
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client/Lead</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No estimates found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {estimates.map((estimate) => (
          <Card key={estimate.id} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4" onClick={() => onView(estimate)}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{estimate.title}</p>
                    {estimate.eventName && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {estimate.eventName}
                      </div>
                    )}
                    {estimate.eventVenue && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPinIcon className="mr-1 h-3 w-3" />
                        {estimate.eventVenue}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(estimate);
                        }}
                        disabled={estimate.status !== "DRAFT"}
                      >
                        <EditIcon className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSend(estimate);
                        }}
                        disabled={estimate.status !== "DRAFT" && estimate.status !== "SENT"}
                      >
                        <SendIcon className="mr-2 h-4 w-4" />
                        Send
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(estimate);
                        }}
                        disabled={estimate.status !== "DRAFT"}
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
                    {(estimate.client || estimate.lead) && (
                      <p className="text-muted-foreground">
                        {estimate.client?.name || estimate.lead?.name}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(estimate.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      variant="secondary"
                      className={`text-white ${statusColors[estimate.status]}`}
                    >
                      {statusLabels[estimate.status]}
                    </Badge>
                    <p className="font-semibold">
                      {formatCurrency(calculateTotal(estimate.lineItems, estimate.discount || 0), currencyCode)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead/Client</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.map((estimate) => (
              <TableRow
                key={estimate.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(estimate)}
              >
                <TableCell className="font-medium">
                  {estimate.title}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-white ${statusColors[estimate.status]}`}
                  >
                    {statusLabels[estimate.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {(estimate.client || estimate.lead) && (
                      <>
                        <div className="flex items-center text-sm">
                          {estimate.client?.name || estimate.lead?.name}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {estimate.client ? "Client" : "Lead"}
                        </div>
                      </>
                    )}
                    {!estimate.client && !estimate.lead && "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {estimate.eventName && (
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {estimate.eventName}
                      </div>
                    )}
                    {estimate.eventVenue && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPinIcon className="mr-1 h-3 w-3" />
                        {estimate.eventVenue}
                      </div>
                    )}
                    {!estimate.eventName && !estimate.eventVenue && "—"}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(calculateTotal(estimate.lineItems, estimate.discount || 0), currencyCode)}
                </TableCell>
                <TableCell>
                  {new Date(estimate.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(estimate);
                      }}
                      disabled={estimate.status !== "DRAFT"}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSend(estimate);
                      }}
                      disabled={estimate.status !== "DRAFT" && estimate.status !== "SENT"}
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(estimate);
                      }}
                      disabled={estimate.status !== "DRAFT"}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteEstimateDialog
        estimateId={deleteEstimateId}
        estimateTitle={deleteEstimateTitle}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteEstimateId(null);
            setDeleteEstimateTitle("");
          }
        }}
        onSuccess={onDelete}
      />
      
      <SendEstimateDialog
        estimateId={sendEstimateId}
        estimateTitle={sendEstimateTitle}
        clientName={sendClientName}
        clientEmail={sendClientEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSendEstimateId(null);
            setSendEstimateTitle("");
            setSendClientName("");
            setSendClientEmail("");
          }
        }}
        onConfirm={handleConfirmSend}
      />
    </>
  );
}