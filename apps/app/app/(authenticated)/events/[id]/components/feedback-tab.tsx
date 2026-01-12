"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
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
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { Star, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { requestFeedback } from "../../actions";

type FeedbackTabProps = {
  eventId: string;
  eventName: string;
  endDate: Date | null;
  rating: number | null;
  comments: string | null;
};

export function FeedbackTab({
  eventId,
  eventName,
  endDate,
  rating,
  comments,
}: FeedbackTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canRequestFeedback = endDate && endDate < new Date() && rating === null;

  const handleRequestFeedback = () => {
    startTransition(async () => {
      const result = await requestFeedback(eventId);

      if (result.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setSuccess(true);
        setError(null);
        setIsDialogOpen(false);
      }
    });
  };

  // Event hasn't ended yet
  if (!endDate || endDate >= new Date()) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Feedback requests can only be sent after the event has ended.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Feedback already submitted
  if (rating !== null) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Feedback has been received for this event.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Rating</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {comments && (
            <div>
              <h3 className="text-sm font-medium mb-2">Comments</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{comments}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Can request feedback
  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Feedback request email has been sent successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-muted p-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Request Client Feedback</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Send a feedback request email to your client. They'll receive a secure link to rate their experience and leave comments.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={isPending || !canRequestFeedback}
          size="lg"
          className="mt-4"
        >
          <Mail className="mr-2 h-4 w-4" />
          Request Feedback
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              This will send an email to the client requesting feedback for "{eventName}". 
              The email will contain a secure link that expires in 48 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestFeedback}
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
