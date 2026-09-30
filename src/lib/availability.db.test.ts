import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { query, endPool, hasDb } from "./db";
import {
  checkAvailability,
  createTableReservation,
  findReservations,
  rescheduleTableReservation,
  slotsForDate,
  weekdayOf,
} from "./availability";

const TEST_EMAIL = "vitest-availability@example.com";

/** A Friday ~2 weeks out (late-close day, definitely open and in the future). */
function futureFriday(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DATE = futureFriday();

/** The Saturday right after DATE — also open, used as a reschedule target. */
function nextDay(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

const DATE2 = nextDay(DATE);

function book(partySize: number, time: string) {
  return createTableReservation({
    guestName: "Vitest Guest",
    email: TEST_EMAIL,
    phone: null,
    partySize,
    reservationDate: DATE,
    reservationTime: time,
    notes: "availability integration test",
  });
}

// Requires local Postgres (seeded via `npm run db:migrate`).
describe.runIf(hasDb)("table availability + booking (integration)", () => {
  beforeAll(() => {
    // Small, deterministic capacity for the assertions below.
    process.env.RESTAURANT_SEATS = "10";
    expect(weekdayOf(DATE)).toBe(5);
    expect(slotsForDate(DATE)).toContain("19:00");
  });

  // Isolate on the synthetic test date so leftover rows can't skew capacity.
  beforeEach(async () => {
    await query("DELETE FROM reservations WHERE reservation_date IN ($1, $2)", [DATE, DATE2]);
  });

  afterAll(async () => {
    await query("DELETE FROM reservations WHERE email = $1", [TEST_EMAIL]);
    await endPool();
  });

  it("books a table and writes a standalone row (event_id NULL, status booked)", async () => {
    const result = await book(4, "19:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = await query<{
      event_id: string | null;
      status: string;
      reservation_time: string;
      party_size: number;
      payment_status: string;
    }>(
      "SELECT event_id, status, reservation_time, party_size, payment_status FROM reservations WHERE id = $1",
      [result.id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].event_id).toBeNull();
    expect(rows[0].status).toBe("booked");
    expect(rows[0].party_size).toBe(4);
    expect(rows[0].reservation_time.slice(0, 5)).toBe("19:00");
    expect(rows[0].payment_status).toBe("not_required");
  });

  it("books around an existing reservation (overlapping slot loses seats, distant slot is free)", async () => {
    await book(8, "19:00"); // 8 of 10 seats taken for the 19:00 turn

    // 19:30 overlaps the 19:00 turn → only 2 seats left, party of 4 won't fit.
    const overlapping = await checkAvailability(DATE, "19:30", 4);
    expect(overlapping.available).toBe(false);
    expect(overlapping.reason).toBe("full");
    expect(overlapping.seatsRemaining).toBe(2);
    // ...but a slot >90 min away is wide open, and offered as an alternative.
    expect(overlapping.alternatives).toContain("21:00");

    const distant = await checkAvailability(DATE, "21:00", 4);
    expect(distant.available).toBe(true);
  });

  it("never overbooks a slot beyond capacity", async () => {
    await book(8, "19:00"); // 2 seats remain
    const tooBig = await book(4, "19:00");
    expect(tooBig.ok).toBe(false);
    if (tooBig.ok) return;
    expect(tooBig.reason).toBe("full");
    expect(tooBig.seatsRemaining).toBe(2);

    // A party that exactly fits the remaining seats still succeeds.
    const fits = await book(2, "19:00");
    expect(fits.ok).toBe(true);
  });

  it("refuses to book outside opening hours", async () => {
    const late = await book(2, "23:00"); // past last seating
    expect(late.ok).toBe(false);
    if (late.ok) return;
    expect(late.reason).toBe("closed");
  });

  it("finds a reservation by email, and nothing with no identifier or a wrong one", async () => {
    const result = await book(3, "19:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byEmail = await findReservations({ email: TEST_EMAIL });
    expect(byEmail).toHaveLength(1);
    expect(byEmail[0].id).toBe(result.id);
    expect(byEmail[0].partySize).toBe(3);
    expect(byEmail[0].reservationDate).toBe(DATE);
    expect(byEmail[0].reservationTime).toBe("19:00");
    expect(byEmail[0].status).toBe("booked");

    // Email matching is case-insensitive.
    const upperCase = await findReservations({ email: TEST_EMAIL.toUpperCase() });
    expect(upperCase).toHaveLength(1);

    const wrongEmail = await findReservations({ email: "nobody@example.com" });
    expect(wrongEmail).toHaveLength(0);

    const noIdentifier = await findReservations({ date: DATE });
    expect(noIdentifier).toHaveLength(0);
  });

  it("finds a reservation by partial, case-insensitive name", async () => {
    const result = await createTableReservation({
      guestName: "Johnny Quest",
      email: TEST_EMAIL,
      phone: null,
      partySize: 2,
      reservationDate: DATE,
      reservationTime: "19:00",
      notes: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fullName = await findReservations({ name: "Johnny Quest" });
    expect(fullName.map((r) => r.id)).toContain(result.id);

    const partialLowerCase = await findReservations({ name: "quest" });
    expect(partialLowerCase.map((r) => r.id)).toContain(result.id);

    const noMatch = await findReservations({ name: "Race Bannon" });
    expect(noMatch.find((r) => r.id === result.id)).toBeUndefined();
  });

  it("reschedules a reservation to a new date/time when identity matches and the new slot fits", async () => {
    const result = await book(4, "19:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const moved = await rescheduleTableReservation({
      reservationId: result.id,
      email: TEST_EMAIL,
      reservationDate: DATE2,
      reservationTime: "20:00",
    });
    expect(moved).toEqual({ ok: true, reservationDate: DATE2, reservationTime: "20:00" });

    const rows = await findReservations({ email: TEST_EMAIL });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(result.id);
    expect(rows[0].reservationDate).toBe(DATE2);
    expect(rows[0].reservationTime).toBe("20:00");
  });

  it("refuses to reschedule without a matching email/phone", async () => {
    const result = await book(4, "19:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const wrongIdentity = await rescheduleTableReservation({
      reservationId: result.id,
      email: "nobody@example.com",
      reservationDate: DATE2,
      reservationTime: "20:00",
    });
    expect(wrongIdentity).toEqual({ ok: false, reason: "not_found" });

    const noIdentity = await rescheduleTableReservation({
      reservationId: result.id,
      reservationDate: DATE2,
      reservationTime: "20:00",
    });
    expect(noIdentity).toEqual({ ok: false, reason: "not_found" });
  });

  it("refuses to reschedule into a full or closed slot, leaving the original untouched", async () => {
    const result = await book(4, "19:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await createTableReservation({
      guestName: "Other Guest",
      email: "other@example.com",
      phone: null,
      partySize: 8,
      reservationDate: DATE2,
      reservationTime: "20:00",
      notes: null,
    }); // fills 8 of 10 seats on DATE2 at 20:00

    const full = await rescheduleTableReservation({
      reservationId: result.id,
      email: TEST_EMAIL,
      reservationDate: DATE2,
      reservationTime: "20:00",
    });
    expect(full.ok).toBe(false);
    if (full.ok) return;
    expect(full.reason).toBe("full");
    expect(full.seatsRemaining).toBe(2);

    const closed = await rescheduleTableReservation({
      reservationId: result.id,
      email: TEST_EMAIL,
      reservationDate: DATE2,
      reservationTime: "23:00",
    });
    expect(closed).toEqual({ ok: false, reason: "closed" });

    // Neither failed attempt should have moved the original reservation.
    const rows = await findReservations({ email: TEST_EMAIL });
    expect(rows.find((r) => r.id === result.id)?.reservationDate).toBe(DATE);
  });

  it("does not double-count its own seats when rescheduling within the same overlapping turn", async () => {
    const result = await book(8, "19:00"); // 8 of 10 seats on DATE at 19:00
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Moving the same reservation to an overlapping time on the same day should
    // succeed — its own 8 seats shouldn't count against itself.
    const moved = await rescheduleTableReservation({
      reservationId: result.id,
      email: TEST_EMAIL,
      reservationDate: DATE,
      reservationTime: "19:30",
    });
    expect(moved).toEqual({ ok: true, reservationDate: DATE, reservationTime: "19:30" });
  });
});
