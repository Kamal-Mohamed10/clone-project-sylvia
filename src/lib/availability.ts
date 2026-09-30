import "server-only";
import { query, withTransaction } from "./db";
import { HOURS } from "./info";

/**
 * Table-availability + booking logic for the concierge. Reservations are seated in
 * fixed-length turns; a party "fits" a requested time if enough seats are free
 * across every overlapping turn. Booking re-checks capacity inside a transaction
 * (guarded by a per-day advisory lock) so concurrent requests can't overbook.
 *
 * The pure helpers (minute math, slot generation, overlap math) take no DB and are
 * unit-tested in availability.test.ts.
 */

/** Minutes per bookable slot. */
export const SLOT_MINUTES = 30;
/** How long a table is held per booking (a "turn"). */
export const TURN_MINUTES = 90;
/** Latest a party can be seated before closing. */
export const LAST_SEATING_BEFORE_CLOSE = 60;
/** Largest party the chatbot books directly; bigger groups use the package flow. */
export const MAX_ONLINE_PARTY = 12;

/** Total seats available in any single turn. Override with RESTAURANT_SEATS. */
export function totalSeats(): number {
  const n = Number(process.env.RESTAURANT_SEATS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

// ── pure time helpers ──────────────────────────────────────────────────────────

/** "HH:MM" (or "HH:MM:SS") → minutes since midnight, or null if malformed. */
export function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** minutes since midnight → "HH:MM". */
export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** getDay() index (0=Sun) for an ISO "YYYY-MM-DD" date, parsed as a local date. */
export function weekdayOf(dateISO: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

/**
 * Bookable slot start times ("HH:MM") for a date, from open until
 * LAST_SEATING_BEFORE_CLOSE minutes before close. Empty array when closed.
 */
export function slotsForDate(dateISO: string): string[] {
  const wd = weekdayOf(dateISO);
  if (wd === null) return [];
  const hours = HOURS[wd];
  if (!hours) return [];
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  if (open === null || close === null) return [];
  const lastSeating = close - LAST_SEATING_BEFORE_CLOSE;
  const slots: string[] = [];
  for (let t = open; t <= lastSeating; t += SLOT_MINUTES) slots.push(toHHMM(t));
  return slots;
}

/** True when `hhmm` is a valid bookable slot for the date. */
export function isOpenSlot(dateISO: string, hhmm: string): boolean {
  return slotsForDate(dateISO).includes(hhmm.slice(0, 5));
}

type BookedRow = { minutes: number; partySize: number };

/**
 * Seats occupied at `targetMinutes`, counting any booking whose turn overlaps it.
 * Two turns overlap when their start times are less than TURN_MINUTES apart.
 */
export function seatsBookedAt(rows: BookedRow[], targetMinutes: number): number {
  return rows.reduce(
    (sum, r) =>
      Math.abs(r.minutes - targetMinutes) < TURN_MINUTES ? sum + r.partySize : sum,
    0,
  );
}

// ── DB-backed availability ──────────────────────────────────────────────────────

/** Booked table rows (time + party size) for one date. */
async function bookedRowsForDate(dateISO: string): Promise<BookedRow[]> {
  const rows = await query<{ reservation_time: string; party_size: number }>(
    `SELECT reservation_time, party_size
       FROM reservations
      WHERE reservation_date = $1
        AND status = 'booked'
        AND reservation_time IS NOT NULL`,
    [dateISO],
  );
  return rows
    .map((r) => ({
      minutes: toMinutes(r.reservation_time),
      partySize: r.party_size,
    }))
    .filter((r): r is BookedRow => r.minutes !== null);
}

export type AvailabilityResult = {
  available: boolean;
  /** Why unavailable: closed slot, oversized party, or full. */
  reason?: "closed" | "party_too_large" | "full";
  seatsRemaining: number;
  /** Open slot times that could seat this party, for offering alternatives. */
  alternatives: string[];
};

/**
 * Whether `partySize` can be seated on `dateISO` at `time`, netting out existing
 * bookings, plus alternative slots for the same day. Read-only.
 */
export async function checkAvailability(
  dateISO: string,
  time: string,
  partySize: number,
): Promise<AvailabilityResult> {
  const hhmm = time.slice(0, 5);
  if (partySize > MAX_ONLINE_PARTY) {
    return { available: false, reason: "party_too_large", seatsRemaining: 0, alternatives: [] };
  }
  const rows = await bookedRowsForDate(dateISO);
  const seats = totalSeats();
  const alternatives = slotsForDate(dateISO).filter((slot) => {
    const t = toMinutes(slot)!;
    return partySize <= seats - seatsBookedAt(rows, t);
  });

  if (!isOpenSlot(dateISO, hhmm)) {
    return { available: false, reason: "closed", seatsRemaining: 0, alternatives };
  }
  const target = toMinutes(hhmm)!;
  const seatsRemaining = seats - seatsBookedAt(rows, target);
  const available = partySize <= seatsRemaining;
  return {
    available,
    reason: available ? undefined : "full",
    seatsRemaining,
    // When the exact slot works, no need to also list it as an alternative.
    alternatives: available ? [] : alternatives,
  };
}

/** Open slots that can seat `partySize` on `dateISO`. Read-only. */
export async function availableSlots(
  dateISO: string,
  partySize: number,
): Promise<string[]> {
  if (partySize > MAX_ONLINE_PARTY) return [];
  const rows = await bookedRowsForDate(dateISO);
  const seats = totalSeats();
  return slotsForDate(dateISO).filter(
    (slot) => partySize <= seats - seatsBookedAt(rows, toMinutes(slot)!),
  );
}

export type ReservationLookup = {
  id: number;
  guestName: string;
  email: string;
  phone: string | null;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: "booked" | "cancelled";
  notes: string | null;
};

/**
 * Finds a guest's standalone table reservations (event_id NULL, reservation_time
 * set) by name, email, and/or phone, optionally narrowed to one date. Read-only.
 * Returns [] if no identifier is given, rather than scanning every reservation.
 * Name is a partial, case-insensitive match (least precise of the three — several
 * guests can share a name, email/phone can't), so callers should prefer email or
 * phone when the guest has one handy.
 */
export async function findReservations(input: {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
}): Promise<ReservationLookup[]> {
  if (!input.name && !input.email && !input.phone) return [];

  const conditions = ["reservation_time IS NOT NULL"];
  const params: string[] = [];
  if (input.name) {
    // Escape LIKE metacharacters so a guest's own input can't widen the match
    // pattern (e.g. a bare "%" or "_" would otherwise match every/any name).
    const escaped = input.name.trim().replace(/[\\%_]/g, "\\$&");
    params.push(`%${escaped}%`);
    conditions.push(`guest_name ILIKE $${params.length}`);
  }
  if (input.email) {
    params.push(input.email.trim().toLowerCase());
    conditions.push(`lower(email) = $${params.length}`);
  }
  if (input.phone) {
    params.push(input.phone.trim());
    conditions.push(`phone = $${params.length}`);
  }
  if (input.date) {
    params.push(input.date);
    conditions.push(`reservation_date = $${params.length}`);
  }

  const rows = await query<{
    id: number;
    guest_name: string;
    email: string;
    phone: string | null;
    party_size: number;
    reservation_date: Date | string;
    reservation_time: string;
    status: "booked" | "cancelled";
    notes: string | null;
  }>(
    `SELECT id, guest_name, email, phone, party_size, reservation_date, reservation_time, status, notes
       FROM reservations
      WHERE ${conditions.join(" AND ")}
      ORDER BY reservation_date DESC, reservation_time DESC
      LIMIT 10`,
    params,
  );

  return rows.map((r) => ({
    id: r.id,
    guestName: r.guest_name,
    email: r.email,
    phone: r.phone,
    partySize: r.party_size,
    // pg returns DATE columns as JS Date objects (in local time) by default;
    // use UTC parts so the calendar day doesn't shift across a timezone.
    reservationDate:
      r.reservation_date instanceof Date
        ? r.reservation_date.toISOString().slice(0, 10)
        : String(r.reservation_date).slice(0, 10),
    reservationTime: r.reservation_time.slice(0, 5),
    status: r.status,
    notes: r.notes,
  }));
}

export type TableBookingInput = {
  guestName: string;
  email: string;
  phone: string | null;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes: string | null;
};

export type BookingResult =
  | { ok: true; id: number }
  | { ok: false; reason: "closed" | "party_too_large" | "full"; seatsRemaining: number };

/** 31-bit non-negative hash of a string — used as a per-day advisory lock key. */
function dayLockKey(dateISO: string): number {
  let h = 0;
  const s = `avail:${dateISO}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h & 0x7fffffff;
}

/**
 * Books a table if the slot still fits. Serializes same-day bookings with an
 * advisory lock and re-checks capacity inside the transaction, so two concurrent
 * requests can never overbook. Standalone table booking: event_id NULL,
 * status 'booked', payment_status 'not_required' (no deposit for normal tables).
 */
export async function createTableReservation(
  input: TableBookingInput,
): Promise<BookingResult> {
  const hhmm = input.reservationTime.slice(0, 5);
  if (input.partySize > MAX_ONLINE_PARTY) {
    return { ok: false, reason: "party_too_large", seatsRemaining: 0 };
  }
  if (!isOpenSlot(input.reservationDate, hhmm)) {
    return { ok: false, reason: "closed", seatsRemaining: 0 };
  }

  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [
      dayLockKey(input.reservationDate),
    ]);

    const booked = await client.query<{ reservation_time: string; party_size: number }>(
      `SELECT reservation_time, party_size
         FROM reservations
        WHERE reservation_date = $1
          AND status = 'booked'
          AND reservation_time IS NOT NULL`,
      [input.reservationDate],
    );
    const rows: BookedRow[] = booked.rows
      .map((r) => ({ minutes: toMinutes(r.reservation_time), partySize: r.party_size }))
      .filter((r): r is BookedRow => r.minutes !== null);

    const seatsRemaining = totalSeats() - seatsBookedAt(rows, toMinutes(hhmm)!);
    if (input.partySize > seatsRemaining) {
      return { ok: false as const, reason: "full" as const, seatsRemaining };
    }

    const inserted = await client.query<{ id: number }>(
      `INSERT INTO reservations
         (event_id, guest_name, email, phone, party_size, reservation_date,
          reservation_time, notes, status, payment_status)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, 'booked', 'not_required')
       RETURNING id`,
      [
        input.guestName,
        input.email,
        input.phone,
        input.partySize,
        input.reservationDate,
        hhmm,
        input.notes,
      ],
    );
    return { ok: true as const, id: inserted.rows[0].id };
  });
}

export type RescheduleResult =
  | { ok: true; reservationDate: string; reservationTime: string }
  | { ok: false; reason: "not_found" | "closed" | "full"; seatsRemaining?: number };

/**
 * Moves a standalone table reservation to a new date/time in place (same id, same
 * guest). Identity-guarded like cancelTableReservation. Re-checks capacity for the
 * new slot inside a transaction, excluding the reservation's own current seats so
 * moving to a nearby/overlapping time on the same day doesn't double-count them.
 */
export async function rescheduleTableReservation(input: {
  reservationId: number;
  email?: string;
  phone?: string;
  reservationDate: string;
  reservationTime: string;
}): Promise<RescheduleResult> {
  if (!input.email && !input.phone) return { ok: false, reason: "not_found" };

  const hhmm = input.reservationTime.slice(0, 5);
  if (!isOpenSlot(input.reservationDate, hhmm)) {
    return { ok: false, reason: "closed" };
  }

  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [
      dayLockKey(input.reservationDate),
    ]);

    const conditions = ["id = $1", "status = 'booked'", "reservation_time IS NOT NULL"];
    const params: (number | string)[] = [input.reservationId];
    const identity: string[] = [];
    if (input.email) {
      params.push(input.email.trim().toLowerCase());
      identity.push(`lower(email) = $${params.length}`);
    }
    if (input.phone) {
      params.push(input.phone.trim());
      identity.push(`phone = $${params.length}`);
    }
    conditions.push(`(${identity.join(" OR ")})`);

    const existing = await client.query<{ id: number; party_size: number }>(
      `SELECT id, party_size FROM reservations WHERE ${conditions.join(" AND ")}`,
      params,
    );
    if (existing.rows.length === 0) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const partySize = existing.rows[0].party_size;

    const booked = await client.query<{ reservation_time: string; party_size: number }>(
      `SELECT reservation_time, party_size
         FROM reservations
        WHERE reservation_date = $1
          AND status = 'booked'
          AND reservation_time IS NOT NULL
          AND id != $2`,
      [input.reservationDate, input.reservationId],
    );
    const rows: BookedRow[] = booked.rows
      .map((r) => ({ minutes: toMinutes(r.reservation_time), partySize: r.party_size }))
      .filter((r): r is BookedRow => r.minutes !== null);

    const seatsRemaining = totalSeats() - seatsBookedAt(rows, toMinutes(hhmm)!);
    if (partySize > seatsRemaining) {
      return { ok: false as const, reason: "full" as const, seatsRemaining };
    }

    await client.query(
      `UPDATE reservations SET reservation_date = $1, reservation_time = $2 WHERE id = $3`,
      [input.reservationDate, hhmm, input.reservationId],
    );
    return {
      ok: true as const,
      reservationDate: input.reservationDate,
      reservationTime: hhmm,
    };
  });
}

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

/**
 * Cancels a standalone table reservation. Requires the caller to supply the
 * email or phone the reservation was made under — not just the id, which is a
 * sequential integer a chat user could guess or iterate — so this can't be
 * used to cancel a stranger's booking. A mismatch (wrong id, already
 * cancelled, or identity doesn't match) all return the same "not_found" so a
 * guess can't be used to probe whether a given id exists.
 */
export async function cancelTableReservation(input: {
  reservationId: number;
  email?: string;
  phone?: string;
}): Promise<CancelResult> {
  if (!input.email && !input.phone) return { ok: false, reason: "not_found" };

  const conditions = ["id = $1", "status = 'booked'", "reservation_time IS NOT NULL"];
  const params: (number | string)[] = [input.reservationId];
  const identity: string[] = [];
  if (input.email) {
    params.push(input.email.trim().toLowerCase());
    identity.push(`lower(email) = $${params.length}`);
  }
  if (input.phone) {
    params.push(input.phone.trim());
    identity.push(`phone = $${params.length}`);
  }
  conditions.push(`(${identity.join(" OR ")})`);

  const rows = await query<{ id: number }>(
    `UPDATE reservations SET status = 'cancelled'
      WHERE ${conditions.join(" AND ")}
      RETURNING id`,
    params,
  );
  return rows.length > 0 ? { ok: true } : { ok: false, reason: "not_found" };
}
