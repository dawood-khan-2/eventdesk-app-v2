"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { cancelSubscription } from "../actions";
import { toast } from "sonner";

interface CancelSubscriptionDialogProps {
  periodEndDate?: number; // Unix timestamp
  variant?: "default" | "secondary" | "outline";
  buttonText?: string;
}

export function CancelSubscriptionDialog({ 
  periodEndDate, 
  variant = "outline",
  buttonText = "Cancel Subscription" 
}: CancelSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscription();
      
      if ("error" in result) {
        setError(result.error ?? "Failed to cancel subscription");
        return;
      }
      
      toast.success("Subscription cancelled successfully. You'll retain access until the end of your billing period.");
      setOpen(false);
      
      // Refresh the page to update the UI
      window.location.reload();
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "the end of your billing period";
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your Pro subscription?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your subscription will be cancelled at {formatDate(periodEndDate)}.
            You'll continue to have access to Pro features until then.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            After cancellation, your account will revert to the Free plan with a limit of 2 events per month.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
