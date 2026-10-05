"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};
/** True once hydrated client-side; false on the server, so SSR output has no mismatch to reconcile. */
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type DemoField = { id: string; label: string; value: string; display?: string };

const DEMO_FIELDS: DemoField[] = [
  { id: "number", label: "Card number", value: "4242424242424242", display: "4242 4242 4242 4242" },
  { id: "expiry", label: "Expiry", value: "12/34" },
  { id: "cvc", label: "CVC", value: "123" },
  { id: "zip", label: "ZIP", value: "10027" },
  { id: "name", label: "Name on card", value: "Jordan Rivera" },
];

/**
 * Stripe's embedded Checkout renders every field — card number, expiry, CVC,
 * ZIP, name — inside its own cross-origin iframe, so no app code can write
 * test values into them (that's deliberate on Stripe's part, for PCI
 * reasons). This panel is the next best thing for a live demo: a copy
 * button next to every field so nothing has to be typed from memory, plus
 * the steps for the test bank flow (which has no fields to copy at all).
 *
 * Portaled to <body> and fixed-positioned: the reservation modal's dialog
 * animates with a CSS transform, which creates a new containing block for
 * any `position: fixed` descendant — so rendered in place, this would be
 * fixed relative to the dialog, not the viewport, and couldn't sit beside
 * it. Portaling escapes that.
 */
export function DemoPaymentHelper() {
  const mounted = useMounted();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(field: DemoField) {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopiedId(field.id);
      setTimeout(() => setCopiedId((current) => (current === field.id ? null : current)), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — value is still
      // shown on screen to type manually.
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="demo-payment-helper">
      <span className="demo-payment-helper-label">Test mode — demo payment details</span>
      <div className="demo-payment-helper-fields">
        {DEMO_FIELDS.map((field) => (
          <div className="demo-payment-helper-field" key={field.id}>
            <span className="demo-payment-helper-field-label">{field.label}</span>
            <span className="demo-payment-helper-field-value">{field.display ?? field.value}</span>
            <button
              type="button"
              className="demo-payment-helper-copy"
              onClick={() => copy(field)}
            >
              {copiedId === field.id ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>
      <p className="demo-payment-helper-bank">
        Testing the bank option instead? Choose <strong>Bank</strong>, search for{" "}
        <strong>Test Institution</strong>, and pick any listed account — no login needed.
      </p>
    </div>,
    document.body,
  );
}
