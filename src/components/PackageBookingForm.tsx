"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MAX_PARTY_SIZE } from "@/lib/validators";
import {
  tiersForPartySize,
  dishImage,
  findPackageMenu,
  depositCents,
  type PackageMenu,
} from "@/lib/packages";
import { DepositCheckout } from "./DepositCheckout";

type SubmitState =
  | { status: "idle" | "submitting" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; message: string; partySize: number }
  | { status: "checkout"; clientSecret: string; deposit: number; partySize: number }
  | { status: "paid"; deposit: number; partySize: number };

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * The party-size + package-tier browsing + guest-info + Stripe-deposit-checkout
 * UI, factored out of the event RSVP modal so it can also run standalone on
 * /cater (no calendar event attached — `eventId` is null there).
 *
 * Renders the same `.event-calendar-modal-media` / `.event-calendar-modal-text`
 * two-column layout the vendored clone CSS already styles (scoped under
 * `.events-calendar`, which this component's wrapper div supplies locally, so
 * it doesn't depend on the page's <body> class). `children` renders at the top
 * of the text column — the caller supplies event-specific chrome there (title,
 * description, time) or nothing for a standalone booking.
 */
export function PackageBookingForm({
  eventId,
  bookingLabel,
  photoUrl,
  defaultDate,
  minDate,
  maxDate,
  children,
}: {
  eventId: string | null;
  bookingLabel: string;
  photoUrl?: string | null;
  defaultDate?: string;
  minDate?: string;
  maxDate?: string;
  children?: ReactNode;
}) {
  const [dialogEl, setDialogEl] = useState<HTMLDivElement | null>(null);
  // A dedicated, always-empty layer to portal the package preview into. Portaling
  // straight into the dialog (which React also fills with content) can throw
  // removeChild on cleanup and tear down the whole thing; an empty container
  // React owns but never adds siblings to avoids that.
  const [popoverLayer, setPopoverLayer] = useState<HTMLDivElement | null>(null);

  const [partySize, setPartySize] = useState(2);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  // Hover/focus preview of a package's dishes. The popover is portaled into the
  // dialog (the one positioned ancestor that doesn't clip the content region)
  // and placed from the hovered item's rect measured relative to the dialog.
  const [preview, setPreview] = useState<{
    menu: PackageMenu;
    top: number;
    left: number;
    flip: boolean;
  } | null>(null);

  const openPreview = (
    e: React.SyntheticEvent<HTMLButtonElement>,
    menu: PackageMenu,
  ) => {
    if (!dialogEl) return;
    const btn = e.currentTarget.getBoundingClientRect();
    const box = dialogEl.getBoundingClientRect();
    const POPOVER_W = 300;
    const GAP = 10;
    const flip = btn.right - box.left + GAP + POPOVER_W > box.width;
    const left = flip
      ? Math.max(GAP, btn.left - box.left - GAP - POPOVER_W)
      : btn.right - box.left + GAP;
    const estHeight = 150 + 140 + menu.sampleItems.length * 44;
    const top = Math.min(
      Math.max(GAP, btn.top - box.top),
      Math.max(GAP, box.height - estHeight - GAP),
    );
    setPreview({ menu, top, left, flip });
  };
  const closePreview = () => setPreview(null);

  const availableTiers = tiersForPartySize(partySize);
  const availableMenuIds = availableTiers.flatMap((t) => t.menus.map((m) => m.id));
  // A stored menu only counts while the party still qualifies for it, so the
  // choice self-clears if the size drops below that tier's minimum.
  const effectivePackage =
    selectedPackage && availableMenuIds.includes(selectedPackage) ? selectedPackage : null;

  const fieldError = (name: string) =>
    state.status === "error" ? state.fieldErrors?.[name] : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      eventId,
      guestName: String(fd.get("guestName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      partySize,
      reservationDate: String(fd.get("reservationDate") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      packageId: effectivePackage,
    };
    // Package bookings collect a deposit first (embedded Stripe Checkout);
    // free reservations are confirmed directly.
    const endpoint = effectivePackage ? "/api/checkout" : "/api/reservations";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setState({
          status: "error",
          message: data.error ?? "Something went wrong.",
          fieldErrors: data.fieldErrors,
        });
        return;
      }
      if (effectivePackage) {
        setState({
          status: "checkout",
          clientSecret: data.clientSecret,
          deposit: data.depositCents,
          partySize,
        });
      } else {
        setState({ status: "success", message: data.message, partySize });
      }
    } catch {
      setState({ status: "error", message: "Network error — please try again." });
    }
  }

  const depositPreview = (() => {
    if (!effectivePackage) return null;
    const found = findPackageMenu(effectivePackage);
    return found ? depositCents(found.menu.pricePerPerson, partySize) : null;
  })();

  return (
    <div className="events-calendar">
      {/* The positioned ancestor the popover layer/portal measure against — kept
          as a sibling of .package-popover-layer (not a shared parent with it),
          matching the original modal's structure, since .event-calendar-modal-content
          can scroll internally and would clip an absolutely-positioned popover
          nested inside it. */}
      <div className="package-booking-frame" ref={setDialogEl}>
      <div className="event-calendar-modal-content">
        {/* Left column: optional photo, then the large-party menu browser. */}
        <div className="event-calendar-modal-media">
          {photoUrl && (
            <div className="modal-media-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="" />
            </div>
          )}
          {(state.status === "idle" ||
            state.status === "submitting" ||
            state.status === "error") &&
            availableTiers.length > 0 && (
            <div className="reservation-field modal-media-packages">
              <span className="reservation-label">
                Event menus for {partySize} guests
              </span>
              <div className="reservation-packages">
                <div className="reservation-packages-head">
                  Optional: select your large party package served in your private room!
                </div>
                <div className="reservation-packages-scroll">
                  {availableTiers.map((tier) => (
                    <div className="package-tier" key={tier.id}>
                      <div className="package-tier-head">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="package-tier-photo" src={tier.imageUrl} alt="" />
                        <div className="package-tier-heading">
                          <span className="package-tier-name">{tier.name}</span>
                          <span className="reservation-package-min">
                            {tier.minGuests}+
                          </span>
                        </div>
                      </div>
                      <div className="package-tier-menus">
                        {tier.menus.map((m) => {
                          const active = effectivePackage === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              className="reservation-package"
                              aria-pressed={active}
                              onClick={() => setSelectedPackage(active ? null : m.id)}
                              onMouseEnter={(e) => openPreview(e, m)}
                              onFocus={(e) => openPreview(e, m)}
                              onMouseLeave={closePreview}
                              onBlur={closePreview}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                className="reservation-package-thumb"
                                src={m.imageUrl}
                                alt=""
                              />
                              <span className="reservation-package-body">
                                <span className="reservation-package-top">
                                  <span className="reservation-package-name">
                                    {m.name}
                                  </span>
                                  <span className="reservation-package-price">
                                    ${m.pricePerPerson}
                                    <small>/guest</small>
                                  </span>
                                </span>
                                <span className="reservation-package-summary">
                                  {m.summary}
                                </span>
                                {m.note && (
                                  <span className="reservation-package-note">
                                    {m.note}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {fieldError("packageId") && (
                <p className="reservation-error">{fieldError("packageId")}</p>
              )}
            </div>
          )}
        </div>

        {/* Right column: caller-supplied chrome (event title/description/time,
            or nothing), then the reservation form. */}
        <div className="event-calendar-modal-text">
          {children}

          {state.status === "success" || state.status === "paid" ? (
            <div className="reservation-success" role="status">
              <div className="reservation-success-badge">✓</div>
              {state.status === "paid" ? (
                <>
                  <h3>Deposit received!</h3>
                  <p>
                    Your {usd(state.deposit)} deposit is in — your booking for{" "}
                    {state.partySize} at Sylvia&apos;s is confirmed.
                  </p>
                  <p className="reservation-success-sub">
                    A confirmation and balance details will follow by email.
                  </p>
                </>
              ) : (
                <>
                  <h3>Booking confirmed!</h3>
                  <p>{state.message}</p>
                  <p className="reservation-success-sub">
                    A confirmation will follow by email.
                  </p>
                </>
              )}
            </div>
          ) : state.status === "checkout" ? (
            <div className="reservation-checkout">
              <h3 className="reservation-heading">Secure your booking</h3>
              <p className="reservation-subhead">
                A {usd(state.deposit)} deposit confirms your booking for{" "}
                {state.partySize}. The balance is settled at the restaurant.
              </p>
              <DepositCheckout
                clientSecret={state.clientSecret}
                onComplete={() =>
                  setState({ status: "paid", deposit: state.deposit, partySize: state.partySize })
                }
              />
              <button
                type="button"
                className="reservation-checkout-back"
                onClick={() => setState({ status: "idle" })}
              >
                ← Back to details
              </button>
            </div>
          ) : (
            <form className="reservation-form" onSubmit={onSubmit} noValidate>
              <h3 className="reservation-heading">
                {eventId ? "Reserve a table" : bookingLabel}
              </h3>
              <p className="reservation-subhead">
                Groups of 11 or more can book a large party package in a private
                room — just set your party size below.
              </p>

              {state.status === "error" && !state.fieldErrors && (
                <p className="reservation-alert" role="alert">
                  {state.message}
                </p>
              )}

              <div className="reservation-row reservation-row-top">
                <div className="reservation-field">
                  <span className="reservation-label">How many in your party?</span>
                  <div className="party-stepper">
                    <button
                      type="button"
                      aria-label="Decrease party size"
                      onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                      disabled={partySize <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="party-count"
                      aria-label="Party size"
                      inputMode="numeric"
                      min={1}
                      max={MAX_PARTY_SIZE}
                      value={partySize === 0 ? "" : partySize}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setPartySize(0);
                          return;
                        }
                        const n = Math.floor(Number(raw));
                        if (!Number.isNaN(n)) {
                          setPartySize(Math.min(MAX_PARTY_SIZE, Math.max(1, n)));
                        }
                      }}
                      onBlur={() => setPartySize((n) => (n < 1 ? 1 : n))}
                    />
                    <button
                      type="button"
                      aria-label="Increase party size"
                      onClick={() => setPartySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))}
                      disabled={partySize >= MAX_PARTY_SIZE}
                    >
                      +
                    </button>
                    <span className="party-suffix">
                      {partySize === 1 ? "guest" : "guests"}
                    </span>
                  </div>
                  <p className="reservation-hint">
                    Parties over {MAX_PARTY_SIZE}? Please call (212) 996-0660.
                  </p>
                </div>

                <div className="reservation-field">
                  <label className="reservation-label" htmlFor="reservationDate">
                    Date of visit
                  </label>
                  <input
                    id="reservationDate"
                    name="reservationDate"
                    type="date"
                    className="reservation-date"
                    required
                    defaultValue={defaultDate}
                    min={minDate}
                    max={maxDate}
                  />
                  {fieldError("reservationDate") && (
                    <p className="reservation-error">{fieldError("reservationDate")}</p>
                  )}
                </div>
              </div>

              <div className="reservation-field">
                <label className="reservation-label" htmlFor="guestName">
                  Full name
                </label>
                <input
                  id="guestName"
                  name="guestName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jordan Rivera"
                  defaultValue={eventId ? "Jordan Rivera" : undefined}
                />
                {fieldError("guestName") && (
                  <p className="reservation-error">{fieldError("guestName")}</p>
                )}
              </div>

              <div className="reservation-row">
                <div className="reservation-field">
                  <label className="reservation-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    defaultValue={eventId ? "jordan.rivera@example.com" : undefined}
                  />
                  {fieldError("email") && (
                    <p className="reservation-error">{fieldError("email")}</p>
                  )}
                </div>
                <div className="reservation-field">
                  <label className="reservation-label" htmlFor="phone">
                    Phone <span className="reservation-optional">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(212) 555-0100"
                    defaultValue={eventId ? "(212) 555-0100" : undefined}
                  />
                </div>
              </div>

              <div className="reservation-field">
                <label className="reservation-label" htmlFor="notes">
                  Special requests <span className="reservation-optional">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Allergies, seating, a birthday to celebrate…"
                  defaultValue={eventId ? "Window seat if possible." : undefined}
                />
              </div>

              <button
                type="submit"
                className="reservation-submit"
                disabled={state.status === "submitting"}
              >
                {state.status === "submitting"
                  ? depositPreview != null
                    ? "Starting checkout…"
                    : "Reserving…"
                  : depositPreview != null
                    ? `Reserve with ${usd(depositPreview)} deposit`
                    : `Confirm reservation for ${partySize}`}
              </button>
            </form>
          )}
        </div>
      </div>

      {preview &&
        popoverLayer &&
        createPortal(
          <div
            className={`package-detail-popover${preview.flip ? " is-flipped" : ""}`}
            role="tooltip"
            style={{ top: preview.top, left: preview.left }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="package-detail-photo" src={preview.menu.imageUrl} alt="" />
            <div className="package-detail-body">
              <div className="package-detail-head">
                <span className="package-detail-name">{preview.menu.name}</span>
                <span className="package-detail-price">
                  ${preview.menu.pricePerPerson}
                  <small>/guest</small>
                </span>
              </div>
              <div className="package-detail-summary">{preview.menu.summary}</div>
              <span className="package-detail-label">On the menu</span>
              <ul className="package-detail-list">
                {preview.menu.sampleItems.map((item) => (
                  <li key={item}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="package-detail-dish-thumb"
                      src={dishImage(item, preview.menu.imageUrl)}
                      alt=""
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {preview.menu.note && (
                <div className="package-detail-note">{preview.menu.note}</div>
              )}
            </div>
          </div>,
          popoverLayer,
        )}
      <div className="package-popover-layer" ref={setPopoverLayer} />
      </div>
    </div>
  );
}
