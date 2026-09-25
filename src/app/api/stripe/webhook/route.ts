import type Stripe from "stripe";
import { getStripe, hasStripe } from "@/lib/stripe";
import { markReservationPaid, markReservationFailed } from "@/lib/reservations";

/**
 * Stripe webhook — the source of truth for deposit fulfillment. The success
 * UI is not trusted (the customer may never load it). Every event's signature
 * is verified against STRIPE_WEBHOOK_SECRET before it's processed.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!hasStripe || !secret) {
    return new Response("Webhook not configured.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature.", { status: 400 });
  }

  const body = await request.text(); // raw body required for signature check
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature.", { status: 400 });
  }

  try {
    switch (event.type) {
      // Fires when checkout completes. With delayed-notification methods it can
      // arrive while still 'unpaid' — only fulfill once it's actually paid.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "unpaid") {
          const pi =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null);
          await markReservationPaid(session.id, pi);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markReservationFailed(session.id);
        break;
      }
      default:
        break; // ignore unrelated events
    }
  } catch (err) {
    // Return 500 so Stripe retries; the DB updates are idempotent.
    console.error(`Error handling webhook ${event.type}:`, err);
    return new Response("Handler error.", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
