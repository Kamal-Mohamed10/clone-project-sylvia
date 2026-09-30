import { z } from "zod";
import { findPackageMenu } from "./packages";

export const MAX_PARTY_SIZE = 200;

/**
 * Validation for a reservation submission. Inputs arrive as strings from a
 * FormData submission, so we coerce/trim and normalize before validating.
 */
export const ReservationSchema = z.object({
  // Absent for a standalone large-party/catering booking (no calendar event) —
  // present when RSVPing to a specific event from the events calendar.
  eventId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  guestName: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long.")
    .optional()
    .transform((v) => (v ? v : null)),
  partySize: z.coerce
    .number()
    .int("Party size must be a whole number.")
    .min(1, "At least 1 guest.")
    .max(MAX_PARTY_SIZE, `For parties over ${MAX_PARTY_SIZE}, please call us.`),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date for your visit."),
  notes: z
    .string()
    .trim()
    .max(500, "Please keep requests under 500 characters.")
    .optional()
    .transform((v) => (v ? v : null)),
  packageId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
}).superRefine((data, ctx) => {
  if (data.packageId == null) return;
  const found = findPackageMenu(data.packageId);
  if (!found) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["packageId"],
      message: "That menu isn't available.",
    });
    return;
  }
  if (data.partySize < found.tier.minGuests) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["packageId"],
      message: `${found.tier.name} menus need at least ${found.tier.minGuests} guests.`,
    });
  }
});

export type ReservationInput = z.infer<typeof ReservationSchema>;

/** Largest party the chatbot books directly (kept in sync with availability.ts). */
export const MAX_ONLINE_PARTY = 12;

/** Today's date as "YYYY-MM-DD" in local time (booking can't be in the past). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Validation for a chatbot table booking. Standalone from ReservationSchema: no
 * event, a required time slot, and a party capped at the online limit.
 */
export const TableReservationSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(2, "Please provide the guest's name.")
    .max(120, "Name is too long."),
  email: z.string().trim().toLowerCase().email("A valid email is required."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  partySize: z.coerce
    .number()
    .int("Party size must be a whole number.")
    .min(1, "At least 1 guest.")
    .max(MAX_ONLINE_PARTY, `For parties over ${MAX_ONLINE_PARTY}, please use our large-party packages.`),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date (YYYY-MM-DD).")
    .refine((d) => d >= todayISO(), "That date is in the past."),
  reservationTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Choose a time (HH:MM, 24-hour)."),
  notes: z
    .string()
    .trim()
    .max(500, "Please keep requests under 500 characters.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type TableReservationInput = z.infer<typeof TableReservationSchema>;

/** Validation for a chatbot reservation reschedule: just the new date/time. */
export const RescheduleReservationSchema = z.object({
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date (YYYY-MM-DD).")
    .refine((d) => d >= todayISO(), "That date is in the past."),
  reservationTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Choose a time (HH:MM, 24-hour)."),
});
