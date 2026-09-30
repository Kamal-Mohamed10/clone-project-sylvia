"use client";

import { useEffect } from "react";
import type { EventItem } from "@/lib/types";
import { cardTimeRange } from "@/lib/calendar";
import { PackageBookingForm } from "./PackageBookingForm";

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
          {/* PackageBookingForm supplies its own .event-calendar-modal-content +
              media/text columns + popover layer (it's the same component /cater
              uses standalone); this dialog only adds the modal's dark overlay
              chrome and close button around it. */}
          <PackageBookingForm
            key={event.id}
            eventId={event.id}
            bookingLabel={event.title}
            photoUrl={event.imageUrl}
            defaultDate={event.recurring ? nextOccurrence(event.startDate) : event.startDate}
            minDate={event.recurring ? todayISO() : event.startDate}
            maxDate={event.recurring ? undefined : event.startDate}
          >
            <h2>{event.title}</h2>
            <p className="event-main-text event-day">{event.dayLabel}</p>
            <div
              className="event-info-text"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
            <p className="event-main-text event-time">
              {cardTimeRange(event.startTime, event.endTime)}
            </p>
          </PackageBookingForm>
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
