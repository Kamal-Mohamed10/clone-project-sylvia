"use client";

import { useEffect, useRef, useState } from "react";
import type { EventItem } from "@/lib/types";
import { cardTimeRange } from "@/lib/calendar";
import { MAX_PARTY_SIZE } from "@/lib/validators";

type SubmitState =
  | { status: "idle" | "submitting" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; message: string; partySize: number };

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
        <div className="event-calendar-modal-dialog">
          <div className="event-calendar-modal-content">
            <div className="event-calendar-modal-media" aria-hidden="true">
              {event.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.imageUrl} alt="" />
              )}
            </div>
            <div className="event-calendar-modal-text">
              <ModalBody key={event.id} event={event} onClose={onClose} />
            </div>
          </div>
          <button
            aria-label="Close event"
            className="event-calendar-modal-close"
            type="button"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalBody({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [partySize, setPartySize] = useState(2);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

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
    };
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setState({ status: "success", message: data.message, partySize });
      } else {
        setState({
          status: "error",
          message: data.error ?? "Something went wrong.",
          fieldErrors: data.fieldErrors,
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Network error — please try again.",
      });
    }
  }

  return (
    <>
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
      {state.status === "success" ? (
        <div className="reservation-success" role="status">
          <div className="reservation-success-badge">✓</div>
          <h3>Table reserved!</h3>
          <p>{state.message}</p>
          <p className="reservation-success-sub">
            A confirmation will follow by email.
          </p>
          <button type="button" className="reservation-submit" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form ref={formRef} className="reservation-form" onSubmit={onSubmit} noValidate>
          <h3 className="reservation-heading">Reserve a table</h3>

          {state.status === "error" && !state.fieldErrors && (
            <p className="reservation-alert" role="alert">
              {state.message}
            </p>
          )}

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
              <span className="party-count" aria-live="polite">
                {partySize}
              </span>
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
            {event.recurring ? (
              <input
                id="reservationDate"
                name="reservationDate"
                type="date"
                required
                defaultValue={nextOccurrence(event.startDate)}
                min={todayISO()}
              />
            ) : (
              <input type="text" name="reservationDate" readOnly value={event.startDate} />
            )}
            {fieldError("reservationDate") && (
              <p className="reservation-error">{fieldError("reservationDate")}</p>
            )}
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
              ? "Reserving…"
              : `Confirm reservation for ${partySize}`}
          </button>
        </form>
      )}
    </>
  );
}
