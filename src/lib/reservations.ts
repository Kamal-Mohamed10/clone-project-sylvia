import "server-only";
import { query } from "./db";
import type { ReservationInput } from "./validators";

/** Inserts a confirmed (no-deposit) reservation and returns its new id. */
export async function createReservation(
  data: ReservationInput,
): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO reservations
       (event_id, guest_name, email, phone, party_size, reservation_date, notes, package,
        payment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'not_required')
     RETURNING id`,
    [
      data.eventId,
      data.guestName,
      data.email,
      data.phone,
      data.partySize,
      data.reservationDate,
      data.notes,
      data.packageId,
    ],
  );
  return rows[0].id;
}

/**
 * Inserts a reservation awaiting a deposit payment. It stays 'pending' until
 * the Stripe webhook confirms payment. Parameterized (injection-safe).
 */
export async function createPendingReservation(
  data: ReservationInput,
  deposit: number,
): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO reservations
       (event_id, guest_name, email, phone, party_size, reservation_date, notes, package,
        payment_status, deposit_cents)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
     RETURNING id`,
    [
      data.eventId,
      data.guestName,
      data.email,
      data.phone,
      data.partySize,
      data.reservationDate,
      data.notes,
      data.packageId,
      deposit,
    ],
  );
  return rows[0].id;
}

/** Records the Checkout Session that will collect a pending reservation's deposit. */
export async function linkCheckoutSession(
  reservationId: number,
  sessionId: string,
): Promise<void> {
  await query(
    `UPDATE reservations SET stripe_session_id = $1 WHERE id = $2`,
    [sessionId, reservationId],
  );
}

/**
 * Marks the reservation tied to a Checkout Session as paid. Idempotent: only
 * flips a still-pending row, so replayed webhook events are safe.
 */
export async function markReservationPaid(
  sessionId: string,
  paymentIntentId: string | null,
): Promise<void> {
  await query(
    `UPDATE reservations
        SET payment_status = 'paid', stripe_payment_intent = $2
      WHERE stripe_session_id = $1 AND payment_status = 'pending'`,
    [sessionId, paymentIntentId],
  );
}

/** Marks the reservation tied to a Checkout Session as failed (async decline). */
export async function markReservationFailed(sessionId: string): Promise<void> {
  await query(
    `UPDATE reservations
        SET payment_status = 'failed'
      WHERE stripe_session_id = $1 AND payment_status = 'pending'`,
    [sessionId],
  );
}
