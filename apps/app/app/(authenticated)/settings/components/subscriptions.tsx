"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@repo/design-system/components/ui/alert";
import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env";
import { 
  createEmbeddedCheckoutSession, 
  validateCheckoutSession,
  getCurrentSubscription 
} from "../actions";
import { useSearchParams, useRouter } from "next/navigation";
import { ContactSalesDialog } from "./contact-sales-dialog";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";

interface SubscriptionData {
  id: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: number;
  currentPeriodStart: number;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  createdAt: Date;
  amount: number;
  currency: string;
  interval: string;
}

export function Subscriptions() {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? undefined;
  const sessionId = searchParams.get("session_id") ?? undefined;
  const shouldUpgrade = searchParams.get("upgrade") === "true";
  const [mode, setMode] = useState<"pricing" | "checkout" | "success">(
    status === "success" ? "success" : "pricing"
  );
  const [successInfo, setSuccessInfo] = useState<{
    plan?: string;
    amount?: number | null;
    currency?: string | null;
    status?: string | null;
  } | null>(null);

  // Fetch current subscription on mount
  useEffect(() => {
    startTransition(async () => {
      const result = await getCurrentSubscription();
      if ("data" in result) {
        console.log("Subscription data:", result.data);
        setSubscription(result.data ?? null);
      }
      setIsLoading(false);
    });
  }, []);

  // Auto-start checkout if upgrade param is present and user doesn't have subscription
  useEffect(() => {
    if (shouldUpgrade && !isLoading && !subscription) {
      startProCheckout();
    }
  }, [shouldUpgrade, isLoading, subscription]);

  useEffect(() => {
    if (status === "success" && sessionId) {
      startTransition(async () => {
        const result = await validateCheckoutSession(sessionId);
        if ("error" in result) {
          setError(result.error ?? "Validation failed");
          return;
        }
        const { data } = result as { data: any };
        setSuccessInfo({
          plan: undefined,
          amount: data.amount_total,
          currency: data.currency,
          status: data.payment_status ?? data.status,
        });
        setMode("success");
      });
    }
  }, [status, sessionId]);

  useEffect(() => {
    async function mountEmbeddedCheckout() {
      if (!clientSecret || !containerRef.current) return;

      const stripe = await loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) {
        setError("Failed to initialize Stripe");
        return;
      }

      const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
      await checkout.mount(containerRef.current);
    }
    mountEmbeddedCheckout();
  }, [clientSecret]);

  async function startProCheckout() {
    setError(null);
    setMode("checkout");
    const res = await createEmbeddedCheckoutSession({
      priceId: "price_1SzFDjF4nDSIqYaCBrx8RZjD",
      quantity: 1,
    });
    if ("error" in res) {
      setError(res.error ?? "Failed to start checkout");
      setMode("pricing");
      return;
    }
    const { data } = res as { data: { clientSecret: string } };
    setClientSecret(data.clientSecret);
  }

  const formatDate = (timestamp: number | undefined | null) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const hasActiveSubscription = subscription && subscription.status === "active";

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mode === "pricing" && (
        <>
          {hasActiveSubscription && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Current Subscription</CardTitle>
                {!subscription.cancelAtPeriodEnd && (
                  <CancelSubscriptionDialog 
                    periodEndDate={subscription.currentPeriodEnd}
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-medium">Pro</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()} / {subscription.interval}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {subscription.cancelAtPeriodEnd ? (
                          <span className="text-orange-600">
                            Cancels on {formatDate(subscription.currentPeriodEnd)}
                          </span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p className="font-medium">
                        {subscription.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {!subscription.cancelAtPeriodEnd && (
                      <div>
                        <p className="text-muted-foreground">Next billing date</p>
                        <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border p-6">
              <h3 className="text-base font-semibold">Free</h3>
              <p className="text-2xl font-bold mt-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2">All features. Upto 2 events per month.</p>
              <div className="mt-4">
                {hasActiveSubscription ? (
                  subscription.cancelAtPeriodEnd ? (
                    <Button disabled>Switching on {formatDate(subscription.currentPeriodEnd)}</Button>
                  ) : (
                    <CancelSubscriptionDialog 
                      periodEndDate={subscription.currentPeriodEnd}
                      variant="secondary"
                      buttonText="Downgrade to Free"
                    />
                  )
                ) : (
                  <Button disabled>Current Plan</Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-primary p-6 relative">
              {!hasActiveSubscription && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <h3 className="text-base font-semibold">Pro</h3>
              <p className="text-2xl font-bold mt-1">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2">All features. Unlimited events per month.</p>
              <div className="mt-4">
                {hasActiveSubscription ? (
                  <Button disabled>Current Plan</Button>
                ) : (
                  <Button onClick={startProCheckout} disabled={isPending || isLoading}>
                    {isPending ? "Starting Checkout..." : "Upgrade to Pro"}
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <h3 className="text-base font-semibold">Pro +</h3>
              <p className="text-sm text-muted-foreground mt-2">Custom features tailored to fit your workflow.</p>
              <div className="mt-4">
                <ContactSalesDialog />
              </div>
            </div>
          </div>
        </>
      )}

      {mode === "checkout" && (
        <div>
          <div ref={containerRef} className="min-h-[600px]" />
        </div>
      )}

      {mode === "success" && (
        <div className="rounded-lg border p-6">
          <h3 className="text-base font-semibold">Subscription Successful</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your subscription has been activated. You can manage billing details later.
          </p>
          <div className="mt-4 text-sm">
            {successInfo?.amount && (
              <p>
                Amount: {successInfo.amount / 100} {successInfo.currency?.toUpperCase()}
              </p>
            )}
            {successInfo?.status && <p>Status: {successInfo.status}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

