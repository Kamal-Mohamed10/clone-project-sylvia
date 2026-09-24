import "server-only";
import { hasDb, sql } from "./db";
import { SEED_EVENTS } from "./seed-data";
import type { EventItem } from "./types";

/**
 * Returns upcoming events ordered by start date.
 * Falls back to seed data when no database is configured (demo mode).
 */
export async function getEvents(): Promise<EventItem[]> {
  if (!hasDb) {
    return [...SEED_EVENTS].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  }

  const { rows } = await sql<{
    id: string;
    slug: string;
    title: string;
    description: string;
    start_date: string;
    start_time: string;
    end_time: string | null;
    day_label: string;
    recurring: boolean;
    image_url: string | null;
  }>`
    SELECT id, slug, title, description, start_date, start_time,
           end_time, day_label, recurring, image_url
    FROM events
    ORDER BY start_date ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    // start_date comes back as a Date-ish string; keep the YYYY-MM-DD part.
    startDate: String(r.start_date).slice(0, 10),
    startTime: r.start_time,
    endTime: r.end_time,
    dayLabel: r.day_label,
    recurring: r.recurring,
    imageUrl: r.image_url,
  }));
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) ?? null;
}
