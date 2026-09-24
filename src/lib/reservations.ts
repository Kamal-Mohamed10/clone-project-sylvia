import "server-only";
import { query } from "./db";
import type { ReservationInput } from "./validators";

/** Inserts a reservation and returns its new id. Parameterized (injection-safe). */
export async function createReservation(
  data: ReservationInput,
): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO reservations
       (event_id, guest_name, email, phone, party_size, reservation_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.eventId,
      data.guestName,
      data.email,
      data.phone,
      data.partySize,
      data.reservationDate,
      data.notes,
    ],
  );
  return rows[0].id;
}
