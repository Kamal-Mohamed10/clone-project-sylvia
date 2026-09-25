import { z } from "zod";
import { findPackageMenu } from "./packages";

export const MAX_PARTY_SIZE = 200;

/**
 * Validation for a reservation submission. Inputs arrive as strings from a
 * FormData submission, so we coerce/trim and normalize before validating.
 */
export const ReservationSchema = z.object({
  eventId: z.string().min(1, "Missing event."),
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
