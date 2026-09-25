import "server-only";
import Stripe from "stripe";

/**
 * Shared server-side Stripe client. Cached on globalThis so Next.js dev
 * hot-reloads don't spawn a new client (and new connection pool) each time.
 * API version is intentionally omitted so the account's default (latest)
 * pinned by the SDK is used.
 */
const globalForStripe = globalThis as unknown as { _stripe?: Stripe };

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  if (!globalForStripe._stripe) {
    globalForStripe._stripe = new Stripe(key);
  }
  return globalForStripe._stripe;
}

export const hasStripe: boolean = Boolean(process.env.STRIPE_SECRET_KEY);
