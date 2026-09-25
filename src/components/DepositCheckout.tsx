"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

// Module-level singleton: Stripe.js is loaded once for the whole app.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Renders Stripe's embedded Checkout inside the reservation modal. The parent
 * fetches the Checkout Session's client secret from /api/checkout. Because the
 * session uses `redirect_on_completion: 'never'`, `onComplete` fires in place
 * when payment succeeds — no navigation away from the site.
 */
export function DepositCheckout({
  clientSecret,
  onComplete,
}: {
  clientSecret: string;
  onComplete: () => void;
}) {
  if (!stripePromise) {
    return (
      <p className="reservation-alert" role="alert">
        Payments are not configured.
      </p>
    );
  }
  return (
    <div className="deposit-checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
