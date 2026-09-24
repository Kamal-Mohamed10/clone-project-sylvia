import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "@/app/api/reservations/route";
import { query, endPool, hasDb } from "@/lib/db";

const TEST_EMAIL = "vitest-reservation@example.com";

function postJson(body: unknown): Request {
  return new Request("http://localhost/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = {
  eventId: "2342013", // Halloween (seeded)
  guestName: "Vitest Guest",
  email: TEST_EMAIL,
  phone: "(212) 555-0199",
  partySize: 4,
  reservationDate: "2026-10-31",
  notes: "integration test",
};

// These tests require the local Postgres (seeded via `npm run db:migrate`).
describe.runIf(hasDb)("POST /api/reservations (integration)", () => {
  beforeAll(async () => {
    await query("DELETE FROM reservations WHERE email = $1", [TEST_EMAIL]);
  });
  afterAll(async () => {
    await query("DELETE FROM reservations WHERE email = $1", [TEST_EMAIL]);
    await endPool();
  });

  it("creates a reservation and persists it (normalized)", async () => {
    const res = await POST(postJson({ ...valid, email: "VITEST-Reservation@Example.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const rows = await query<{
      guest_name: string;
      email: string;
      party_size: number;
      event_id: string;
    }>("SELECT guest_name, email, party_size, event_id FROM reservations WHERE email = $1", [
      TEST_EMAIL,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe(TEST_EMAIL); // lowercased
    expect(rows[0].party_size).toBe(4);
    expect(rows[0].event_id).toBe("2342013");
  });

  it("rejects invalid input with field errors (400)", async () => {
    const res = await POST(
      postJson({ ...valid, email: "nope", partySize: 0, guestName: "J" }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(Object.keys(data.fieldErrors)).toEqual(
      expect.arrayContaining(["email", "partySize", "guestName"]),
    );
  });

  it("returns 404 for an unknown event", async () => {
    const res = await POST(postJson({ ...valid, eventId: "0000000" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
