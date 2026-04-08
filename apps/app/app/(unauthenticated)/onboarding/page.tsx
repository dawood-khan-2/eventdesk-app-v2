"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationList, useUser } from "@repo/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@repo/design-system/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { seedDemoData, type EventType } from "@/lib/seed-demo-data";

export default function OnboardingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { createOrganization, setActive, isLoaded, userMemberships } = useOrganizationList();

  const [orgName, setOrgName] = useState("");
  const [eventType, setEventType] = useState<EventType>("MARRIAGE");
  const [loading, setLoading] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orgCreated, setOrgCreated] = useState(false);

  // Show event type selection - controlled by environment variable
  const showEventTypeSelection = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "false";

  // If not signed in, send to sign-in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // If user already has a membership, skip onboarding
  const hasMembership = useMemo(
    () => (userMemberships?.data?.length ?? 0) > 0,
    [userMemberships]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (hasMembership) {
      router.replace("/");
    }
  }, [isLoaded, hasMembership, router]);

  const onApply = async () => {
    if (!isLoaded || loading) return;
    setError(null);

    const name = orgName.trim();
    if (!name && !orgCreated) {
      setError("Please enter an organization name.");
      return;
    }

    try {
      setLoading(true);
      
      // Only create org if not already created
      if (!orgCreated) {
        setSeedingProgress("Creating organization...");
        const org = await createOrganization({ name });
        await setActive({ organization: org });
        setOrgCreated(true);
        
        // Wait for webhook to create internal org record (only needed after org creation)
        if (showEventTypeSelection) {
          setSeedingProgress("Setting up your workspace...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Seed demo data if feature flag is enabled
      if (showEventTypeSelection) {
        await loadDemoDataWithRetry();
      }

      setSeedingProgress("Redirecting...");
      router.replace("/");
      // Don't set loading to false here - let the redirect happen
      // The finally block will only run if there's an error
    } catch (err: any) {
      // If org creation failed, show error
      if (!orgCreated) {
        setError(err?.message || "Failed to create organization. Please try again.");
      } else {
        // Org was created but demo data failed - allow retry
        setError("Demo data couldn't be loaded. Click retry or skip to continue.");
      }
      setSeedingProgress("");
      setLoading(false); // Only set loading to false on error
    }
  };

  const loadDemoDataWithRetry = async () => {
    const maxAttempts = 5;
    const delayMs = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        setSeedingProgress(`Loading demo data${attempt > 0 ? ` (attempt ${attempt + 1})` : ""}...`);
        const result = await seedDemoData(eventType);
        
        // Show different message if data already existed
        if (result.alreadyExists) {
          setSeedingProgress("Demo data already loaded");
        }
        
        return result; // Return the result to indicate success
      } catch (err: any) {
        console.error(`Demo data attempt ${attempt + 1} failed:`, err.message);
        
        if (attempt === maxAttempts - 1) {
          // Last attempt failed - throw to show error to user
          throw err;
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create your organization</CardTitle>
          <CardDescription>You need an organization to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">
              Organization name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Events"
              disabled={loading || !isLoaded}
              required
            />
          </div>

          {showEventTypeSelection && (
            <div className="space-y-3">
              <Label>What kind of events are you planning?</Label>
              <RadioGroup
                value={eventType}
                onValueChange={(value) => setEventType(value as EventType)}
                disabled={loading}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="MARRIAGE" id="marriage" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="marriage" className="font-medium cursor-pointer">
                      Marriage
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Weddings, receptions, and ceremonies
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="CONCERTS" id="concerts" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="concerts" className="font-medium cursor-pointer">
                      Concerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Music festivals, live performances, and shows
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="CONFERENCES" id="conferences" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="conferences" className="font-medium cursor-pointer">
                      Conferences
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Business events, summits, and seminars
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="OTHERS" id="others" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="others" className="font-medium cursor-pointer">
                      Others
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Corporate events, galas, and celebrations
                    </p>
                  </div>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground pt-2">
                We'll set up sample data to help you explore the platform
              </p>
            </div>
          )}

          <Button
            onClick={onApply}
            disabled={loading || !isLoaded}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {seedingProgress || "Creating..."}
              </>
            ) : orgCreated ? (
              "Retry Loading Demo Data"
            ) : (
              "Create organization"
            )}
          </Button>

          {orgCreated && !loading && (
            <Button
              onClick={() => router.replace("/")}
              variant="outline"
              className="w-full"
            >
              Skip and Continue
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}