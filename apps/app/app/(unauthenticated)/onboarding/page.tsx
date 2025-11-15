"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrganizationList, useUser } from "@repo/auth/client";
import { useRouter } from "next/navigation";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";

export default function OnboardingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { createOrganization, setActive, isLoaded, userMemberships } = useOrganizationList();

  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!name) {
      setError("Please enter an organization name.");
      return;
    }

    try {
      setLoading(true);
      const org = await createOrganization({ name });
      await setActive({ organization: org });
      router.replace("/");
    } catch {
      setError("Failed to create organization. Please try again.");
    } finally {
      setLoading(false);
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
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Events"
              disabled={loading || !isLoaded}
            />
          </div>

          <Button
            onClick={onApply}
            disabled={loading || !isLoaded}
            className="w-full"
          >
            {loading ? "Creating..." : "Create organization"}
          </Button>

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