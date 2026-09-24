"use client";

import { useState } from "react";
import type { EventItem } from "@/lib/types";
import { EventCard } from "./EventCard";
import { ReservationModal } from "./ReservationModal";

export function EventsGrid({ events }: { events: EventItem[] }) {
  const [selected, setSelected] = useState<EventItem | null>(null);

  if (events.length === 0) {
    return (
      <p className="text-muted py-12 text-center">
        No events are scheduled right now — check back soon.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} onReserve={() => setSelected(event)} />
          </li>
        ))}
      </ul>

      <ReservationModal
        event={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
