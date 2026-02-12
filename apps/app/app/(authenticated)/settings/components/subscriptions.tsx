"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@repo/design-system/components/ui/alert";
import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env";
import { createEmbeddedCheckoutSession, validateCheckoutSession } from "../actions";
import { useSearchParams, useRouter } from "next/navigation";
import { ContactSalesDialog } from "./contact-sales-dialog";

export function Subscriptions() {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? undefined;
  const sessionId = searchParams.get("session_id") ?? undefined;
  const [mode, setMode] = useState<"pricing" | "checkout" | "success">(
    status === "success" ? "success" : "pricing"
  );
  const [successInfo, setSuccessInfo] = useState<{
    plan?: string;
    amount?: number | null;
    currency?: string | null;
    status?: string | null;
  } | null>(null);

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
          plan: undefined, // optional: map price/product later
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

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mode === "pricing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border p-6">
            <h3 className="text-base font-semibold">Free</h3>
            <p className="text-sm text-muted-foreground mt-2">All features. Upto 2 events per month.</p>
            <div className="mt-4">
              <Button disabled>Current Plan</Button>
            </div>
          </div>
          <div className="rounded-lg border border-primary p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Recommended
            </div>
            <h3 className="text-base font-semibold">Pro</h3>
            <p className="text-sm text-muted-foreground mt-2">All features. Unlimited events per month.</p>
            <div className="mt-4">
              <Button onClick={startProCheckout} disabled={isPending}>
                {isPending ? "Starting Checkout..." : "Upgrade to Pro"}
              </Button>
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
