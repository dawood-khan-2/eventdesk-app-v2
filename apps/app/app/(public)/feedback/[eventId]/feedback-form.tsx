"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { Star, CheckCircle2 } from "lucide-react";
import { Rating, RatingButton } from "@/components/rating-button";
import { submitFeedback } from "./actions";

type FeedbackFormProps = {
  eventId: string;
  eventName: string;
  clientName: string;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  token: string;
};

export function FeedbackForm({
  eventId,
  eventName,
  clientName,
  venue,
  startDate,
  endDate,
  token,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback(token, eventId, rating, comments);

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setError(null);
      }
    });
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Thank you for your feedback!</h2>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Feedback</CardTitle>
        <CardDescription>
          We'd love to hear about your experience with {eventName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Event:</span>
            <p className="font-medium">{eventName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Client:</span>
            <p className="font-medium">{clientName}</p>
          </div>
          {venue && (
            <div>
              <span className="text-sm text-muted-foreground">Venue:</span>
              <p className="font-medium">{venue}</p>
            </div>
          )}
          <div>
            <span className="text-sm text-muted-foreground">Date:</span>
            <p className="font-medium">
              {new Date(startDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {endDate && endDate !== startDate && (
                <span>
                  {" - "}
                  {new Date(endDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            How would you rate your overall experience? <span className="text-destructive">*</span>
          </label>
          <Rating 
            value={rating} 
            onValueChange={setRating}
            className="text-yellow-400"
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <RatingButton key={index} size={40} />
            ))}
          </Rating>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <label htmlFor="comments" className="text-sm font-medium">
            Additional Comments (Optional)
          </label>
          <Textarea
            id="comments"
            placeholder="Tell us more about your experience..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
          size="lg"
        >
          {isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}
