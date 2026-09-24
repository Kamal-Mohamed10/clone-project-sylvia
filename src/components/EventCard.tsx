"use client";

import Image from "next/image";
import type { EventItem } from "@/lib/types";
import { formatTimeRange } from "@/lib/format";

export function EventCard({
  event,
  onReserve,
}: {
  event: EventItem;
  onReserve: () => void;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand/10">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand text-accent">
            <span className="font-display text-5xl font-bold">
              {event.title.charAt(0)}
            </span>
          </div>
        )}
        {event.recurring && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Recurring
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-semibold text-accent-dark">
          {event.dayLabel}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-brand">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {formatTimeRange(event.startTime, event.endTime)}
        </p>
        <p className="mt-3 line-clamp-3 text-sm text-foreground/80">
          {event.description}
        </p>

        <button
          type="button"
          onClick={onReserve}
          className="mt-5 min-h-11 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-[#f6efe2] transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Reserve a table
        </button>
      </div>
    </article>
  );
}
