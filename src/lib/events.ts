import "server-only";
import { query } from "./db";
import type { EventItem } from "./types";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: Date | string;
  end_date: Date | string | null;
  start_time: string;
  end_time: string | null;
  day_label: string;
  recurrence_type: string;
  recurring: boolean;
  image_url: string | null;
};

function toISODate(d: Date | string): string {
  if (d instanceof Date) {
    // Use UTC parts to avoid the local timezone shifting the calendar day.
    return d.toISOString().slice(0, 10);
  }
  return String(d).slice(0, 10);
}

function mapRow(r: EventRow): EventItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    startDate: toISODate(r.start_date),
    endDate: r.end_date ? toISODate(r.end_date) : null,
    startTime: r.start_time,
    endTime: r.end_time,
    dayLabel: r.day_label,
    recurrenceType: r.recurrence_type,
    recurring: r.recurring,
    imageUrl: r.image_url,
  };
}

/** All events, ordered by start date. */
export async function getEvents(): Promise<EventItem[]> {
  const rows = await query<EventRow>(
    `SELECT id, slug, title, description, start_date, end_date, start_time,
            end_time, day_label, recurrence_type, recurring, image_url
       FROM events
      ORDER BY start_date ASC`,
  );
  return rows.map(mapRow);
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const rows = await query<EventRow>(
    `SELECT id, slug, title, description, start_date, end_date, start_time,
            end_time, day_label, recurrence_type, recurring, image_url
       FROM events WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}
