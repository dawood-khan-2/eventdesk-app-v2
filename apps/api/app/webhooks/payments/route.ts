import { analytics } from "@repo/analytics/server";
import { database } from "@repo/database";
import { parseError } from "@repo/observability/error";
import { log } from "@repo/observability/log";
import type { Stripe } from "@repo/payments";
import { stripe } from "@repo/payments";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";

const handleCheckoutSessionCompleted = async (
  data: Stripe.Checkout.Session
) => {
  // Extract required data from checkout session
  const userId = data.client_reference_id;
  const customerId = typeof data.customer === "string" ? data.customer : data.customer?.id;
  const subscriptionId = typeof data.subscription === "string" ? data.subscription : data.subscription?.id;

  if (!userId || !customerId || !subscriptionId) {
    log.warn("Missing required data in checkout.session.completed", {
      userId,
      customerId,
      subscriptionId,
    });
    return;
  }

  // Create or update subscription record
  await database.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    },
  });

  log.info("Subscription created", { userId, subscriptionId });

  analytics.capture({
    event: "User Subscribed",
    distinctId: userId,
  });
};

const handleSubscriptionUpdated = async (
  data: Stripe.Subscription
) => {
  const subscriptionId = data.id;
  const customerId = typeof data.customer === "string" ? data.customer : data.customer?.id;

  if (!subscriptionId) {
    log.warn("Missing subscription ID in customer.subscription.updated");
    return;
  }

  log.info("Processing subscription update", { 
    subscriptionId, 
    customerId,
    cancelAtPeriodEnd: data.cancel_at_period_end 
  });

  try {
    // First, check if subscription exists
    const existing = await database.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!existing) {
      log.warn("Subscription record not found in database - may not have been created via checkout", { 
        subscriptionId,
        customerId 
      });
      return;
    }

    // Update cancelAtPeriodEnd flag in database
    await database.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        cancelAtPeriodEnd: data.cancel_at_period_end,
      },
    });

    log.info("Subscription updated successfully", { subscriptionId, cancelAtPeriodEnd: data.cancel_at_period_end });

    if (data.cancel_at_period_end) {
      analytics.capture({
        event: "Subscription Cancellation Scheduled",
        distinctId: subscriptionId,
      });
    }
  } catch (error) {
    log.error("Error updating subscription", { subscriptionId, error: parseError(error) });
  }
};

const handleSubscriptionDeleted = async (
  data: Stripe.Subscription
) => {
  const subscriptionId = data.id;

  if (!subscriptionId) {
    log.warn("Missing subscription ID in customer.subscription.deleted");
    return;
  }

  try {
    // Delete directly by unique stripeSubscriptionId (returns deleted record)
    const subscription = await database.subscription.delete({
      where: { stripeSubscriptionId: subscriptionId },
    });

    log.info("Subscription deleted", { userId: subscription.userId, subscriptionId });

    analytics.capture({
      event: "User Unsubscribed",
      distinctId: subscription.userId,
    });
  } catch (error) {
    log.warn("Subscription not found", { subscriptionId });
  }
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  try {
    const body = await request.text();
    const headerPayload = await headers();
    const signature = headerPayload.get("stripe-signature");

    if (!signature) {
      throw new Error("missing stripe-signature header");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object);
        break;
      }
      default: {
        log.warn(`Unhandled event type ${event.type}`);
      }
    }

    await analytics.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    log.error(message);

    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
};
