"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Badge } from "@repo/design-system/components/ui/badge";
import { CheckCircle, XCircle, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { updateEstimateApproval } from "./actions";
import { toast } from "sonner";

type LineItem = {
  id: string;
  serviceCategoryId: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  tax: number;
};

type Estimate = {
  id: string;
  title: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  eventName?: string | null;
  eventVenue?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  expiryDate?: string | null;
  createdAt: string;
  discount: number;
  lineItems: LineItem[];
  client?: { id: string; name: string; email: string | null } | null;
  lead?: { id: string; name: string; email: string | null } | null;
};

type EstimateApprovalViewProps = {
  estimate: Estimate;
  token: string;
  estimateId: string;
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
  ACCEPTED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
} as const;

function calculateSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

function calculateDiscount(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  return subtotal * (discountPercent / 100);
}

function calculateTax(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  const discount = calculateDiscount(lineItems, discountPercent);
  const subtotalAfterDiscount = subtotal - discount;

  if (subtotal === 0) return 0;

  return lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.rate;
    const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
    return sum + itemAfterDiscount * (item.tax / 100);
  }, 0);
}

function calculateTotal(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  const discount = calculateDiscount(lineItems, discountPercent);
  const tax = calculateTax(lineItems, discountPercent);
  return subtotal - discount + tax;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function EstimateApprovalView({ estimate, token, estimateId }: EstimateApprovalViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(estimate.status);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateEstimateApproval(token, estimateId, "approve");
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCurrentStatus("ACCEPTED");
      toast.success("Estimate approved successfully!");
    } catch (error) {
      toast.error("Failed to approve estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateEstimateApproval(token, estimateId, "reject");
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setCurrentStatus("REJECTED");
      toast.success("Estimate rejected");
    } catch (error) {
      toast.error("Failed to reject estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientName = estimate.client?.name || estimate.lead?.name || "Client";
  const isActionable = currentStatus === "DRAFT" || currentStatus === "SENT";

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{estimate.title}</h1>
              <p className="text-zinc-600 mt-2">For: {clientName}</p>
            </div>
            <Badge
              variant="secondary"
              className={`text-white ${statusColors[currentStatus]}`}
            >
              {statusLabels[currentStatus]}
            </Badge>
          </div>

          {currentStatus === "ACCEPTED" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">This estimate has been approved</span>
            </div>
          )}

          {currentStatus === "REJECTED" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">This estimate has been rejected</span>
            </div>
          )}
        </div>

        {/* Event Details */}
        {(estimate.eventName || estimate.eventVenue || estimate.eventStartDate) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {estimate.eventName && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span className="font-medium">Event:</span>
                  <span>{estimate.eventName}</span>
                </div>
              )}
              {estimate.eventVenue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  <span className="font-medium">Venue:</span>
                  <span>{estimate.eventVenue}</span>
                </div>
              )}
              {estimate.eventStartDate && (
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(estimate.eventStartDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {estimate.eventEndDate && (
                    <> to {new Date(estimate.eventEndDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estimate.lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start pb-4 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-zinc-500">
                      {item.quantity} {item.unit || "unit"}(s) × {formatCurrency(item.rate)}
                      {item.tax > 0 && ` (Tax: ${item.tax}%)`}
                    </p>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(item.quantity * item.rate)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal(estimate.lineItems))}</span>
              </div>
              {estimate.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({estimate.discount}%):</span>
                  <span>-{formatCurrency(calculateDiscount(estimate.lineItems, estimate.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(calculateTax(estimate.lineItems, estimate.discount))}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal(estimate.lineItems, estimate.discount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {isActionable && (
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleReject}
              disabled={isSubmitting}
              className="min-w-[150px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="h-5 w-5 mr-2" />
              {isSubmitting ? "Processing..." : "Reject"}
            </Button>
            <Button
              size="lg"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="min-w-[150px] bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {isSubmitting ? "Processing..." : "Approve"}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-zinc-500">
          <p>If you have any questions, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
