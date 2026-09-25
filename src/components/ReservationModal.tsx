"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EventItem } from "@/lib/types";
import { cardTimeRange } from "@/lib/calendar";
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

/** Next upcoming occurrence of the event's weekday, as YYYY-MM-DD. */
function nextOccurrence(startDate: string): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(start);
  while (cursor < today) cursor.setDate(cursor.getDate() + 7);
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
}
const todayISO = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};

export function ReservationModal({
  event,
  onClose,
}: {
  event: EventItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("event-calendar-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("event-calendar-modal-open");
    };
  }, [event, onClose]);

  if (!event) return null;

  return <ReservationModalInner event={event} onClose={onClose} />;
}

function ReservationModalInner({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [dialogEl, setDialogEl] = useState<HTMLDivElement | null>(null);
  // A dedicated, always-empty layer to portal the package preview into. Portaling
  // straight into the dialog (which React also fills with content + close button)
  // can throw removeChild on cleanup and tear down the whole modal; an empty
  // container React owns but never adds siblings to avoids that.
  const [popoverLayer, setPopoverLayer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      aria-hidden="false"
      className="event-calendar-modal is-open"
      id="eventCalendarModal"
      role="dialog"
    >
      <div
        className="event-calendar-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="event-calendar-modal-dialog" ref={setDialogEl}>
          <div className="event-calendar-modal-content">
            <ModalBody
              key={event.id}
              event={event}
              onClose={onClose}
              dialogEl={dialogEl}
              popoverLayer={popoverLayer}
            />
          </div>
          <button
            aria-label="Close event"
            className="event-calendar-modal-close"
            type="button"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
          <div className="package-popover-layer" ref={setPopoverLayer} />
        </div>
      </div>
    </div>
  );
}

function ModalBody({
  event,
  onClose,
  dialogEl,
  popoverLayer,
}: {
  event: EventItem;
  onClose: () => void;
  dialogEl: HTMLDivElement | null;
  popoverLayer: HTMLDivElement | null;
}) {
  const [partySize, setPartySize] = useState(2);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // Hover/focus preview of a package's dishes. The popover is portaled into the
  // dialog (the one positioned ancestor that doesn't clip the content region —
  // the media column and its scroll area both hide overflow) and placed from the
  // hovered item's rect measured relative to the dialog.
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
    // Prefer the right of the item; flip to the left if it would overflow.
    const flip = btn.right - box.left + GAP + POPOVER_W > box.width;
    const left = flip
      ? Math.max(GAP, btn.left - box.left - GAP - POPOVER_W)
      : btn.right - box.left + GAP;
    // Keep the card inside the dialog vertically. Its height grows with the dish
    // list (hero photo + header chrome + one ~44px row per dish), so estimate it
    // and clamp the top edge up as needed.
    const estHeight = 150 + 140 + menu.sampleItems.length * 44;
    const top = Math.min(
      Math.max(GAP, btn.top - box.top),
      Math.max(GAP, box.height - estHeight - GAP),
    );
    setPreview({ menu, top, left, flip });
  };
  const closePreview = () => setPreview(null);

  const availableTiers = tiersForPartySize(partySize);
  const availableMenuIds = availableTiers.flatMap((t) =>
    t.menus.map((m) => m.id),
  );
  // A stored menu only counts while the party still qualifies for it, so the
  // choice self-clears if the size drops below that tier's minimum.
  const effectivePackage =
    selectedPackage && availableMenuIds.includes(selectedPackage)
      ? selectedPackage
      : null;

  const fieldError = (name: string) =>
    state.status === "error" ? state.fieldErrors?.[name] : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      eventId: event.id,
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
      setState({
        status: "error",
        message: "Network error — please try again.",
      });
    }
  }

  const depositPreview = (() => {
    if (!effectivePackage) return null;
    const found = findPackageMenu(effectivePackage);
    return found ? depositCents(found.menu.pricePerPerson, partySize) : null;
  })();

  return (
    <>
      {/* Left column: the event picture in its OWN fixed-size box, with the
          large-party menu in a SEPARATE box beneath it. The two are siblings,
          never the same box, so the menu can grow/shrink/appear without ever
          changing the photo's size. */}
      <div className="event-calendar-modal-media">
        <div className="modal-media-photo">
          {event.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" />
          )}
        </div>
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
                      <img
                        className="package-tier-photo"
                        src={tier.imageUrl}
                        alt=""
                      />
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
                            onClick={() =>
                              setSelectedPackage(active ? null : m.id)
                            }
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
        {preview &&
          popoverLayer &&
          createPortal(
            <div
              className={`package-detail-popover${preview.flip ? " is-flipped" : ""}`}
              role="tooltip"
              style={{ top: preview.top, left: preview.left }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="package-detail-photo"
                src={preview.menu.imageUrl}
                alt=""
              />
              <div className="package-detail-body">
                <div className="package-detail-head">
                  <span className="package-detail-name">
                    {preview.menu.name}
                  </span>
                  <span className="package-detail-price">
                    ${preview.menu.pricePerPerson}
                    <small>/guest</small>
                  </span>
                </div>
                <div className="package-detail-summary">
                  {preview.menu.summary}
                </div>
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
      </div>

      {/* Right column: event details + reservation form. */}
      <div className="event-calendar-modal-text">
        {/* Event details (mirrors the original modal text content) */}
        <h2>{event.title}</h2>
      <p className="event-main-text event-day">{event.dayLabel}</p>
      <div
        className="event-info-text"
        dangerouslySetInnerHTML={{ __html: event.description }}
      />
      <p className="event-main-text event-time">
        {cardTimeRange(event.startTime, event.endTime)}
      </p>

      {/* Reservation feature */}
      {state.status === "success" || state.status === "paid" ? (
        <div className="reservation-success" role="status">
          <div className="reservation-success-badge">✓</div>
          {state.status === "paid" ? (
            <>
              <h3>Deposit received!</h3>
              <p>
                Your {usd(state.deposit)} deposit is in — your table for{" "}
                {state.partySize} at Sylvia&apos;s is confirmed.
              </p>
              <p className="reservation-success-sub">
                A confirmation and balance details will follow by email.
              </p>
            </>
          ) : (
            <>
              <h3>Table reserved!</h3>
              <p>{state.message}</p>
              <p className="reservation-success-sub">
                A confirmation will follow by email.
              </p>
            </>
          )}
          <button type="button" className="reservation-submit" onClick={onClose}>
            Done
          </button>
        </div>
      ) : state.status === "checkout" ? (
        <div className="reservation-checkout">
          <h3 className="reservation-heading">Secure your booking</h3>
          <p className="reservation-subhead">
            A {usd(state.deposit)} deposit confirms your table for{" "}
            {state.partySize}. The balance is settled at the restaurant.
          </p>
          <DepositCheckout
            clientSecret={state.clientSecret}
            onComplete={() =>
              setState({
                status: "paid",
                deposit: state.deposit,
                partySize: state.partySize,
              })
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
        <form ref={formRef} className="reservation-form" onSubmit={onSubmit} noValidate>
          <h3 className="reservation-heading">Reserve a table</h3>
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
                  onClick={() =>
                    setPartySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))
                  }
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
              {event.recurring ? (
                <input
                  id="reservationDate"
                  name="reservationDate"
                  type="date"
                  className="reservation-date"
                  required
                  defaultValue={nextOccurrence(event.startDate)}
                  min={todayISO()}
                />
              ) : (
                <input
                  id="reservationDate"
                  name="reservationDate"
                  type="date"
                  className="reservation-date"
                  required
                  defaultValue={event.startDate}
                  min={event.startDate}
                  max={event.startDate}
                />
              )}
              {fieldError("reservationDate") && (
                <p className="reservation-error">
                  {fieldError("reservationDate")}
                </p>
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
    </>
  );
}
