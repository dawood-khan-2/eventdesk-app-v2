"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { registerGuest } from "./actions";

type RegisterFormProps = {
  eventId: string;
  eventName: string;
  clientName: string;
  venue: string | null;
  startDate: Date;
  endDate: Date | null;
  token: string;
};

export function RegisterForm({
  eventId,
  eventName,
  clientName,
  venue,
  startDate,
  endDate,
  token,
}: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate at least one contact method
    if (!email && !phone) {
      setError("Please provide either an email or phone number");
      return;
    }

    startTransition(async () => {
      const result = await registerGuest(token, eventId, {
        name,
        email: email || undefined,
        phone: phone || undefined,
      });

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
              <h2 className="text-2xl font-semibold">Registration Successful!</h2>
              <p className="text-muted-foreground">
                You have been successfully registered for {eventName}.
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
        <CardTitle>Event Registration</CardTitle>
        <CardDescription>
          Register for {eventName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Event:</span>
            <p className="font-medium">{eventName}</p>
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address {!phone && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number {!email && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isPending}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            * At least one contact method (email or phone) is required
          </p>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || !name}
            className="w-full"
            size="lg"
          >
            {isPending ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
