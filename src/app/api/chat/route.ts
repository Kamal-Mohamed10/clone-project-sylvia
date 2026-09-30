import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { conciergeModel, conciergeReady, conciergeSystemPrompt } from "@/lib/concierge";
import { searchMenu } from "@/lib/menu";
import { searchDrinks } from "@/lib/drinks";
import { getSpecials } from "@/lib/specials";
import { getEvents } from "@/lib/events";
import { INFO } from "@/lib/info";
import { SERVICE_TIERS, tiersForPartySize } from "@/lib/packages";
import {
  cancelTableReservation,
  checkAvailability,
  createTableReservation,
  findReservations,
  rescheduleTableReservation,
} from "@/lib/availability";
import { RescheduleReservationSchema, TableReservationSchema } from "@/lib/validators";

// The tool loop and DB calls need Node; never statically cache this endpoint.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The concierge's tools (PRD §3a). Every tool but book_table is read-only; book_table
 * is the sole write and is capacity-guarded inside the DB transaction.
 */
const tools = {
  search_menu: tool({
    description:
      "Search Sylvia's food menu by dish, category, or tag (e.g. chicken, seafood, vegetarian). Returns matching items; empty means we don't serve it.",
    inputSchema: z.object({
      query: z.string().optional().describe("What the guest is looking for, e.g. 'chicken' or 'steak'."),
    }),
    execute: async ({ query }) => searchMenu(query),
  }),

  search_drinks: tool({
    description: "Search Sylvia's drink menu (cocktails, wine, beer, zero-proof, happy hour).",
    inputSchema: z.object({
      query: z.string().optional().describe("What the guest wants, e.g. 'wine' or 'happy hour'."),
    }),
    execute: async ({ query }) => searchDrinks(query),
  }),

  get_specials: tool({
    description: "Get Sylvia's daily specials, optionally for a specific day of the week.",
    inputSchema: z.object({
      day: z.string().optional().describe("Day name/number, or 'today'. Omit for all specials."),
    }),
    execute: async ({ day }) => getSpecials(day),
  }),

  get_events: tool({
    description: "List Sylvia's events (Gospel Brunch, holidays, seasonal nights).",
    inputSchema: z.object({}),
    execute: async () => {
      const events = await getEvents();
      return events.map((e) => ({
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime,
        endTime: e.endTime,
        dayLabel: e.dayLabel,
        recurring: e.recurring,
      }));
    },
  }),

  check_availability: tool({
    description:
      "Check whether a party can be seated at a date and time, netting out existing reservations. Returns availability, seats remaining, and alternative open slots.",
    inputSchema: z.object({
      date: z.string().describe("Reservation date as YYYY-MM-DD."),
      time: z.string().describe("Requested time as HH:MM (24-hour)."),
      partySize: z.number().int().min(1).describe("Number of guests."),
    }),
    execute: async ({ date, time, partySize }) => {
      const result = await checkAvailability(date, time, partySize);
      // For a too-large party, also surface package guidance.
      if (result.reason === "party_too_large") {
        return { ...result, note: "Party exceeds the online booking limit — use get_packages." };
      }
      return result;
    },
  }),

  check_reservation: tool({
    description:
      "Look up a guest's existing table reservation(s) by name, email, and/or phone, optionally narrowed to one date. Ask for at least one before calling — never guess. Name matching is partial and can return several people; email/phone are exact and preferred when the guest has one handy. Returns an empty list if nothing matches.",
    inputSchema: z.object({
      name: z.string().optional().describe("Guest name the reservation was made under."),
      email: z.string().optional().describe("Email the reservation was made under."),
      phone: z.string().optional().describe("Phone number the reservation was made under."),
      date: z.string().optional().describe("Narrow to one date, YYYY-MM-DD."),
    }),
    execute: async ({ name, email, phone, date }) => {
      if (!name && !email && !phone) {
        return { error: "Ask the guest for their name, email, or phone number the reservation was made under." };
      }
      const reservations = await findReservations({ name, email, phone, date });
      return { reservations };
    },
  }),

  book_table: tool({
    description:
      "Book a table. Call ONLY after the guest has confirmed the details. Re-checks capacity; returns the reservation id on success or the reason it couldn't book.",
    inputSchema: z.object({
      guestName: z.string().describe("Guest's full name."),
      email: z.string().describe("Guest's email."),
      phone: z.string().optional().describe("Guest's phone number."),
      partySize: z.number().int().min(1),
      date: z.string().describe("YYYY-MM-DD."),
      time: z.string().describe("HH:MM (24-hour)."),
      notes: z.string().optional().describe("Any special requests."),
    }),
    execute: async (input) => {
      const parsed = TableReservationSchema.safeParse({
        guestName: input.guestName,
        email: input.email,
        phone: input.phone ?? null,
        partySize: input.partySize,
        reservationDate: input.date,
        reservationTime: input.time,
        notes: input.notes ?? null,
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details." };
      }
      const result = await createTableReservation({
        guestName: parsed.data.guestName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        partySize: parsed.data.partySize,
        reservationDate: parsed.data.reservationDate,
        reservationTime: parsed.data.reservationTime,
        notes: parsed.data.notes,
      });
      if (result.ok) {
        return {
          ok: true,
          reservationId: result.id,
          confirmed: {
            name: parsed.data.guestName,
            partySize: parsed.data.partySize,
            date: parsed.data.reservationDate,
            time: parsed.data.reservationTime,
          },
        };
      }
      return { ok: false, reason: result.reason, seatsRemaining: result.seatsRemaining };
    },
  }),

  cancel_reservation: tool({
    description:
      "Cancel a standalone table reservation. Call check_reservation first to find the reservationId and confirm the details with the guest — call this ONLY after they explicitly confirm. Requires the email or phone the reservation was made under (not just the id) so a guessed id can't cancel someone else's booking.",
    inputSchema: z.object({
      reservationId: z.number().int().describe("The id returned by check_reservation."),
      email: z.string().optional().describe("Email the reservation was made under."),
      phone: z.string().optional().describe("Phone number the reservation was made under."),
    }),
    execute: async ({ reservationId, email, phone }) => {
      if (!email && !phone) {
        return { ok: false, error: "Ask the guest for the email or phone the reservation was made under." };
      }
      const result = await cancelTableReservation({ reservationId, email, phone });
      return result;
    },
  }),

  reschedule_reservation: tool({
    description:
      "Move a standalone table reservation to a new date/time. Call check_reservation first to find the reservationId, and check_availability to confirm the new slot is open, before calling this. Call this ONLY after the guest explicitly confirms the new date/time. Requires the email or phone the reservation was made under (not just the id).",
    inputSchema: z.object({
      reservationId: z.number().int().describe("The id returned by check_reservation."),
      email: z.string().optional().describe("Email the reservation was made under."),
      phone: z.string().optional().describe("Phone number the reservation was made under."),
      date: z.string().describe("New reservation date, YYYY-MM-DD."),
      time: z.string().describe("New reservation time, HH:MM (24-hour)."),
    }),
    execute: async ({ reservationId, email, phone, date, time }) => {
      if (!email && !phone) {
        return { ok: false, error: "Ask the guest for the email or phone the reservation was made under." };
      }
      const parsed = RescheduleReservationSchema.safeParse({
        reservationDate: date,
        reservationTime: time,
      });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid new date/time." };
      }
      const result = await rescheduleTableReservation({
        reservationId,
        email,
        phone,
        reservationDate: parsed.data.reservationDate,
        reservationTime: parsed.data.reservationTime,
      });
      return result;
    },
  }),

  get_packages: tool({
    description:
      "Sylvia's large-party and private-event menu packages (for parties too big to book online).",
    inputSchema: z.object({
      partySize: z.number().int().optional().describe("Party size, to filter to qualifying tiers."),
    }),
    execute: async ({ partySize }) =>
      typeof partySize === "number" ? tiersForPartySize(partySize) : SERVICE_TIERS,
  }),

  get_info: tool({
    description: "Sylvia's hours, address, phone, email, and hand-off links (ordering, gift cards, catering, jobs).",
    inputSchema: z.object({}),
    execute: async () => INFO,
  }),
};

export async function POST(request: Request): Promise<Response> {
  const ready = conciergeReady();
  if (!ready.ok) {
    return Response.json({ error: ready.error }, { status: 503 });
  }

  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!Array.isArray(messages)) {
    return Response.json({ error: "Expected a messages array." }, { status: 400 });
  }

  const result = streamText({
    model: conciergeModel(),
    system: conciergeSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools,
    // Allow the model to call tools and then respond in a single turn.
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
