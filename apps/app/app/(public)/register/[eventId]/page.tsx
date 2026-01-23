import { redirect } from "next/navigation";
import { validateRegistrationToken } from "./actions";
import { RegisterForm } from "./register-form";
import { Alert, AlertDescription, AlertTitle } from "@repo/design-system/components/ui/alert";
import { AlertCircle } from "lucide-react";

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function RegisterPage({ params, searchParams }: PageProps) {
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
            This registration link is invalid. Please use the link provided in your invitation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Validate token and fetch event
  const result = await validateRegistrationToken(token, eventId);

  if (result.error || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Unavailable</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { event } = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <RegisterForm
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
