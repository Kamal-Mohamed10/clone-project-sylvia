import type { EventItem } from "./types";

/** Model that mirrors the original Sylvia's calendar-view DOM, built from data. */

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export type CalendarDayEvent = {
  id: string;
  title: string;
  imageUrl: string | null;
  time: string; // e.g. "12:30pm-4pm"
  adaDate: string; // e.g. "Sunday, September 6th, 2026"
};

export type CalendarCell = {
  date: string; // YYYY-MM-DD
  weekDay: (typeof WEEKDAY_ABBR)[number];
  dayNumber: number;
  inMonth: boolean;
  weekend: boolean;
  adaHeader: string; // e.g. "1 event on Sunday, September 6th, 2026"
  events: CalendarDayEvent[];
};

export type CalendarMonth = {
  name: (typeof MONTH_NAMES)[number];
  cells: CalendarCell[];
};

export type CalendarYear = {
  year: number;
  months: CalendarMonth[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "12:30" -> "12:30pm", "16:00" -> "4pm", "11:00" -> "11am" */
function evTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${pad(m)}${period}`;
}

/** Calendar tile time label, e.g. "12:30pm-4pm". */
export function calendarEventTime(start: string, end: string | null): string {
  return end ? `${evTime(start)}-${evTime(end)}` : evTime(start);
}

/** Pinboard/agenda card time label, e.g. "11:00 AM - 10:00 PM". */
export function cardTimeRange(start: string, end: string | null): string {
  const fmt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad(m)} ${period}`;
  };
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
}

export function fullAdaDate(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${WEEKDAY_FULL[d.getDay()]}, ${MONTH_FULL[d.getMonth()]} ${ordinal(
    d.getDate(),
  )}, ${d.getFullYear()}`;
}

/** Lowercase month names an event occurs in (for the month filter). */
export function eventMonthNames(event: EventItem): string[] {
  const start = parseISO(event.startDate);
  if (!event.recurring) return [MONTH_NAMES[start.getMonth()]];
  const end = event.endDate ? parseISO(event.endDate) : start;
  const names = new Set<string>();
  const cursor = new Date(start);
  while (cursor <= end) {
    names.add(MONTH_NAMES[cursor.getMonth()]);
    cursor.setDate(cursor.getDate() + 7);
  }
  return [...names];
}

/** Full ISO timestamp used by the original card data attributes. */
export function cardDataDate(dateISO: string | null): string {
  return dateISO ? `${dateISO}T00:00:00.000+00:00` : "";
}

/** All dates (YYYY-MM-DD) an event occurs on within [rangeStart, rangeEnd]. */
function occurrences(event: EventItem, rangeStart: Date, rangeEnd: Date): string[] {
  const start = parseISO(event.startDate);
  if (!event.recurring) {
    return start >= rangeStart && start <= rangeEnd ? [event.startDate] : [];
  }
  const end = event.endDate ? parseISO(event.endDate) : rangeEnd;
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && cursor <= rangeEnd) {
    if (cursor >= rangeStart) {
      dates.push(iso(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    }
    cursor.setDate(cursor.getDate() + 7); // weekly recurrence
  }
  return dates;
}

/**
 * Builds the calendar model from the current month through December of next
 * year (matching the original), grouped into year-containers.
 * `now` is injectable for testing.
 */
export function buildCalendar(
  events: EventItem[],
  now: Date = new Date(),
): CalendarYear[] {
  const startYear = now.getFullYear();
  const startMonth = now.getMonth();
  const endYear = startYear + 1;
  const endMonth = 11; // December

  const rangeStart = new Date(startYear, startMonth, 1);
  const rangeEnd = new Date(endYear, endMonth + 1, 0); // last day of Dec next year

  // Map each occurrence date -> events on that date.
  const byDate = new Map<string, CalendarDayEvent[]>();
  for (const event of events) {
    for (const date of occurrences(event, rangeStart, rangeEnd)) {
      const list = byDate.get(date) ?? [];
      list.push({
        id: event.id,
        title: event.title,
        imageUrl: event.imageUrl,
        time: calendarEventTime(event.startTime, event.endTime),
        adaDate: fullAdaDate(date),
      });
      byDate.set(date, list);
    }
  }

  const years: CalendarYear[] = [];
  let cur = new Date(startYear, startMonth, 1);
  while (cur <= new Date(endYear, endMonth, 1)) {
    const y = cur.getFullYear();
    const m = cur.getMonth();

    // Grid: Sunday before the 1st through Saturday after the last day.
    const first = new Date(y, m, 1);
    const gridStart = new Date(y, m, 1 - first.getDay());
    const last = new Date(y, m + 1, 0);
    const gridEnd = new Date(y, m, last.getDate() + (6 - last.getDay()));

    const cells: CalendarCell[] = [];
    const day = new Date(gridStart);
    while (day <= gridEnd) {
      const dISO = iso(day.getFullYear(), day.getMonth(), day.getDate());
      const inMonth = day.getMonth() === m;
      const dow = day.getDay();
      const events = inMonth ? byDate.get(dISO) ?? [] : [];
      cells.push({
        date: dISO,
        weekDay: WEEKDAY_ABBR[dow],
        dayNumber: day.getDate(),
        inMonth,
        weekend: dow === 0 || dow === 6,
        adaHeader: `${events.length} event${events.length === 1 ? "" : "s"} on ${fullAdaDate(dISO)}`,
        events,
      });
      day.setDate(day.getDate() + 1);
    }

    let yearBucket = years.find((yr) => yr.year === y);
    if (!yearBucket) {
      yearBucket = { year: y, months: [] };
      years.push(yearBucket);
    }
    yearBucket.months.push({ name: MONTH_NAMES[m], cells });

    cur = new Date(y, m + 1, 1);
  }

  return years;
}
