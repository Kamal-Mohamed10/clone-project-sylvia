"use client";

import { useState } from "react";

const TEST_CARD = "4242424242424242";
const TEST_CARD_DISPLAY = "4242 4242 4242 4242";

/**
 * Stripe's embedded Checkout renders the card number / CVC / bank-login
 * fields inside its own iframe, so no app code — ours or anyone's — can
 * write test values into them (that's deliberate on Stripe's part, for PCI
 * reasons). This panel is the next best thing for a live demo: one click to
 * copy the test card instead of typing 16 digits, plus the exact steps for
 * the test bank flow (which has no fields to copy at all).
 */
export function DemoPaymentHelper() {
  const [copied, setCopied] = useState(false);

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(TEST_CARD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — card number is
      // still shown on screen to type manually.
    }
  }

  return (
    <div className="demo-payment-helper">
      <span className="demo-payment-helper-label">Test mode — demo payment details</span>
      <div className="demo-payment-helper-card">
        <span className="demo-payment-helper-number">{TEST_CARD_DISPLAY}</span>
        <button type="button" className="demo-payment-helper-copy" onClick={copyCard}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <span className="demo-payment-helper-meta">Exp 12/34 · CVC 123 · ZIP 10027</span>
      <p className="demo-payment-helper-bank">
        Testing the bank option instead? Choose <strong>Bank</strong>, search for{" "}
        <strong>Test Institution</strong>, and pick any listed account — no login needed.
      </p>
    </div>
  );
}
