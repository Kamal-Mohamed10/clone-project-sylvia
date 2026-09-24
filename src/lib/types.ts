/** Shared domain types for the Sylvia's events feature. */

export type EventItem = {
  /** Original spotapps event id, reused as the stable primary key. */
  id: string;
  slug: string;
  title: string;
  description: string;
  /** ISO calendar date of the (first) occurrence, e.g. "2026-10-31". */
  startDate: string;
  /** 24h local start time, e.g. "12:30". */
  startTime: string;
  /** 24h local end time, e.g. "22:00". Null when unknown. */
  endTime: string | null;
  /** Human label as shown on the card, e.g. "Every Sunday". */
  dayLabel: string;
  recurring: boolean;
  imageUrl: string | null;
};

export type Reservation = {
  id: number;
  eventId: string;
  guestName: string;
  email: string;
  phone: string | null;
  partySize: number;
  reservationDate: string;
  notes: string | null;
  createdAt: string;
};
