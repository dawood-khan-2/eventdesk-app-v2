import { redirect } from "next/navigation";
import { validateFeedbackToken } from "./actions";
import { FeedbackForm } from "./feedback-form";
import { Alert, AlertDescription, AlertTitle } from "@repo/design-system/components/ui/alert";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function FeedbackPage({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  const { token } = await searchParams;

  // Require token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>
            This feedback link is invalid. Please use the link provided in your email.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Validate token and fetch event
  const result = await validateFeedbackToken(token, eventId);

  if (result.error || !result.data) {
    // Show success message if feedback was already submitted
    if (result.error === "Feedback has already been submitted for this event") {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
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
        </div>
      );
    }

    // Show error for other cases
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { event } = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <FeedbackForm
        eventId={event.id}
        eventName={event.name}
        clientName={event.client.name}
        venue={event.venue}
        startDate={event.startDate}
        endDate={event.endDate}
        token={token}
      />
    </div>
  );
}
