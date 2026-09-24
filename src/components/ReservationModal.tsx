"use client";

import { useActionState, useEffect, useState } from "react";
import type { EventItem } from "@/lib/types";
import { createReservation, type ReservationState } from "@/lib/actions";
import { MAX_PARTY_SIZE } from "@/lib/validators";
import { formatLongDate, formatTimeRange } from "@/lib/format";

const INITIAL: ReservationState = { status: "idle" };

/** Next upcoming Sunday (or today if today is Sunday), as YYYY-MM-DD. */
function nextSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toISOString().slice(0, 10);
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ReservationModal({
  event,
  onClose,
}: {
  event: EventItem | null;
  onClose: () => void;
}) {
  // Lock body scroll + wire Escape while open.
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* keyed so form state resets when switching events */}
        <ReservationForm key={event.id} event={event} onClose={onClose} />
      </div>
    </div>
  );
}

function ReservationForm({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createReservation,
    INITIAL,
  );
  const [partySize, setPartySize] = useState(2);

  const fieldError = (name: string) =>
    state.status === "error" ? state.fieldErrors?.[name] : undefined;

  if (state.status === "success") {
    const c = state.confirmation;
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-4xl">
          🎉
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-brand">
          Table reserved!
        </h2>
        <p className="mt-2 text-foreground/80">
          Thanks, {c.guestName}. We&apos;ve got your party of{" "}
          <strong>{c.partySize}</strong> down for{" "}
          <strong>{c.eventTitle}</strong> on {formatLongDate(c.reservationDate)}.
        </p>
        <p className="mt-2 text-sm text-muted">
          A confirmation will follow by email. See you at Sylvia&apos;s!
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-11 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-[#f6efe2] hover:bg-brand-dark"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-black/10 bg-surface p-5">
        <div>
          <p className="text-sm font-semibold text-accent-dark">
            {event.dayLabel} · {formatTimeRange(event.startTime, event.endTime)}
          </p>
          <h2
            id="reservation-title"
            className="mt-0.5 font-display text-xl font-bold text-brand"
          >
            Reserve · {event.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-full p-2 text-muted hover:bg-black/5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Hidden context */}
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="eventTitle" value={event.title} />
      <input type="hidden" name="partySize" value={partySize} />

      <div className="space-y-5 p-5">
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {state.message}
          </p>
        )}

        {/* Party size — the headline field */}
        <fieldset>
          <legend className="text-sm font-semibold text-foreground">
            How many in your party?
          </legend>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              aria-label="Decrease party size"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              disabled={partySize <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-black/15 text-xl font-bold text-brand disabled:opacity-40 hover:border-accent"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-16 text-center font-display text-3xl font-bold text-brand"
            >
              {partySize}
            </span>
            <button
              type="button"
              aria-label="Increase party size"
              onClick={() =>
                setPartySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))
              }
              disabled={partySize >= MAX_PARTY_SIZE}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-black/15 text-xl font-bold text-brand disabled:opacity-40 hover:border-accent"
            >
              +
            </button>
            <span className="text-sm text-muted">
              {partySize === 1 ? "guest" : "guests"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Parties over {MAX_PARTY_SIZE}? Please call us at (212) 996-0660.
          </p>
        </fieldset>

        {/* Date */}
        <Field label="Date of visit" htmlFor="reservationDate" error={fieldError("reservationDate")}>
          {event.recurring ? (
            <input
              id="reservationDate"
              name="reservationDate"
              type="date"
              required
              defaultValue={nextSunday()}
              min={todayISO()}
              className={inputCls(!!fieldError("reservationDate"))}
            />
          ) : (
            <>
              <input type="hidden" name="reservationDate" value={event.startDate} />
              <p className="rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2.5 text-foreground">
                {formatLongDate(event.startDate)}
              </p>
            </>
          )}
        </Field>

        {/* Name */}
        <Field label="Full name" htmlFor="guestName" error={fieldError("guestName")}>
          <input
            id="guestName"
            name="guestName"
            type="text"
            required
            autoComplete="name"
            placeholder="Jordan Rivera"
            className={inputCls(!!fieldError("guestName"))}
          />
        </Field>

        {/* Email + phone */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={fieldError("email")}>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              className={inputCls(!!fieldError("email"))}
            />
          </Field>
          <Field
            label="Phone"
            htmlFor="phone"
            optional
            error={fieldError("phone")}
          >
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(212) 555-0100"
              className={inputCls(!!fieldError("phone"))}
            />
          </Field>
        </div>

        {/* Notes */}
        <Field
          label="Special requests"
          htmlFor="notes"
          optional
          error={fieldError("notes")}
        >
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Allergies, seating, a birthday to celebrate…"
            className={inputCls(!!fieldError("notes"))}
          />
        </Field>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 border-t border-black/10 bg-surface p-5">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-accent px-4 py-3 font-display text-lg font-bold text-brand-dark transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending
            ? "Reserving…"
            : `Confirm reservation for ${partySize}`}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground"
      >
        <span>{label}</span>
        {optional && (
          <span className="text-xs font-normal text-muted">Optional</span>
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return [
    "w-full rounded-lg border bg-surface px-3 py-2.5 text-foreground",
    "focus:outline-2 focus:outline-offset-1 focus:outline-accent",
    hasError ? "border-red-400" : "border-black/15",
  ].join(" ");
}
