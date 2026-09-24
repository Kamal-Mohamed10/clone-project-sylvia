/** Presentation helpers shared by server and client components. */

/** "12:30" -> "12:30 PM", "11:00" -> "11:00 AM" */
export function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr ?? "00"} ${period}`;
}

/** "2026-10-31" -> "Saturday, October 31, 2026" */
export function formatLongDate(iso: string): string {
  // Parse as local date parts to avoid timezone shifting the day.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Combined time range label, e.g. "11:00 AM – 10:00 PM". */
export function formatTimeRange(start: string, end: string | null): string {
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}
