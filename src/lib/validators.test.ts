import { describe, it, expect } from "vitest";
import { ReservationSchema, MAX_PARTY_SIZE } from "./validators";

const base = {
  eventId: "2342013",
  guestName: "Jordan Rivera",
  email: "jordan@email.com",
  partySize: 2,
  reservationDate: "2026-10-31",
};

describe("ReservationSchema", () => {
  it("normalizes valid input", () => {
    const r = ReservationSchema.safeParse({
      ...base,
      guestName: "  Jordan Rivera ",
      email: "Jordan@Email.COM",
      phone: " (212) 555-0100 ",
      notes: " Booth please ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.guestName).toBe("Jordan Rivera");
      expect(r.data.email).toBe("jordan@email.com");
      expect(r.data.phone).toBe("(212) 555-0100");
      expect(r.data.notes).toBe("Booth please");
    }
  });

  it("turns empty optional fields into null", () => {
    const r = ReservationSchema.safeParse({ ...base, phone: "", notes: "" });
    expect(r.success && r.data.phone).toBeNull();
    expect(r.success && r.data.notes).toBeNull();
  });

  it("coerces party size from a string", () => {
    const r = ReservationSchema.safeParse({ ...base, partySize: "4" });
    expect(r.success && r.data.partySize).toBe(4);
  });

  it("accepts party-size boundaries 1 and MAX", () => {
    expect(ReservationSchema.safeParse({ ...base, partySize: 1 }).success).toBe(true);
    expect(
      ReservationSchema.safeParse({ ...base, partySize: MAX_PARTY_SIZE }).success,
    ).toBe(true);
  });

  it.each([
    ["party size 0", { partySize: 0 }],
    ["party size over max", { partySize: MAX_PARTY_SIZE + 1 }],
    ["bad email", { email: "nope" }],
    ["short name", { guestName: "J" }],
    ["bad date format", { reservationDate: "10/31/2026" }],
    ["missing eventId", { eventId: "" }],
  ])("rejects %s", (_label, override) => {
    const r = ReservationSchema.safeParse({ ...base, ...override });
    expect(r.success).toBe(false);
  });
});
