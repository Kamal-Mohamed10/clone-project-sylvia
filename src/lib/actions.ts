"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { hasDb, sql } from "./db";
import { ReservationSchema } from "./validators";

export type ReservationState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<string, string>>;
    }
  | {
      status: "success";
      confirmation: {
        guestName: string;
        partySize: number;
        eventTitle: string;
        reservationDate: string;
      };
    };

const DEMO_FILE = path.join(process.cwd(), ".reservations.local.json");

async function persistToFile(record: Record<string, unknown>): Promise<void> {
  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await fs.readFile(DEMO_FILE, "utf8"));
  } catch {
    // file doesn't exist yet — start fresh
  }
  existing.push(record);
  await fs.writeFile(DEMO_FILE, JSON.stringify(existing, null, 2), "utf8");
}

/**
 * Server Action for creating an event reservation.
 * Signature matches React's useActionState: (prevState, formData) => state.
 */
export async function createReservation(
  _prevState: ReservationState,
  formData: FormData,
): Promise<ReservationState> {
  const parsed = ReservationSchema.safeParse({
    eventId: formData.get("eventId"),
    guestName: formData.get("guestName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    partySize: formData.get("partySize"),
    reservationDate: formData.get("reservationDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const eventTitle = String(formData.get("eventTitle") ?? "your event");

  try {
    if (hasDb) {
      await sql`
        INSERT INTO reservations
          (event_id, guest_name, email, phone, party_size, reservation_date, notes)
        VALUES
          (${data.eventId}, ${data.guestName}, ${data.email}, ${data.phone},
           ${data.partySize}, ${data.reservationDate}, ${data.notes})
      `;
    } else {
      await persistToFile({ ...data, eventTitle, createdAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Failed to create reservation:", err);
    return {
      status: "error",
      message: "Something went wrong saving your reservation. Please try again.",
    };
  }

  return {
    status: "success",
    confirmation: {
      guestName: data.guestName,
      partySize: data.partySize,
      eventTitle,
      reservationDate: data.reservationDate,
    },
  };
}
