import { ReservationSchema } from "@/lib/validators";
import { createPendingReservation, linkCheckoutSession } from "@/lib/reservations";
import { getEventById } from "@/lib/events";
import { findPackageMenu, depositCents, DEPOSIT_RATE } from "@/lib/packages";
import { getStripe, hasStripe } from "@/lib/stripe";

type ApiResponse =
  | { success: true; clientSecret: string; reservationId: number; depositCents: number }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

/** Random 8-letter suffix for the Checkout Session's dashboard tracking label. */
function integrationLabel(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 8; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return `sylvias-deposit-${s}`;
}

/**
 * Starts a deposit payment for a package reservation. Creates a 'pending'
 * reservation and an embedded Checkout Session, and returns its client secret.
 * The deposit amount is computed here from server-trusted menu prices — the
 * client never sends an amount.
 */
export async function POST(request: Request): Promise<Response> {
  if (!hasStripe) {
    return json({ success: false, error: "Payments are not configured." }, 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: "Invalid request body." }, 400);
  }

  const parsed = ReservationSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json(
      { success: false, error: "Please fix the highlighted fields.", fieldErrors },
      400,
    );
  }
  const data = parsed.data;

  // This endpoint is deposit-only; free reservations go through /api/reservations.
  if (!data.packageId) {
    return json({ success: false, error: "No package selected for deposit." }, 400);
  }
  const found = findPackageMenu(data.packageId);
  if (!found) {
    return json({ success: false, error: "That menu isn't available." }, 400);
  }

  const event = await getEventById(data.eventId);
  if (!event) {
    return json({ success: false, error: "That event could not be found." }, 404);
  }

  const deposit = depositCents(found.menu.pricePerPerson, data.partySize);

  try {
    const reservationId = await createPendingReservation(data, deposit);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      redirect_on_completion: "never",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: deposit,
            product_data: {
              name: `${Math.round(DEPOSIT_RATE * 100)}% deposit — ${found.menu.name}`,
              description: `Party of ${data.partySize} · ${event.title}`,
            },
          },
        },
      ],
      customer_email: data.email,
      integration_identifier: integrationLabel(),
      metadata: {
        reservationId: String(reservationId),
        packageId: data.packageId,
        partySize: String(data.partySize),
      },
      payment_intent_data: {
        metadata: { reservationId: String(reservationId) },
      },
    });

    if (!session.client_secret) {
      return json({ success: false, error: "Could not start checkout." }, 502);
    }
    await linkCheckoutSession(reservationId, session.id);

    return json({
      success: true,
      clientSecret: session.client_secret,
      reservationId,
      depositCents: deposit,
    });
  } catch (err) {
    console.error("Failed to start deposit checkout:", err);
    return json({ success: false, error: "Something went wrong starting checkout." }, 500);
  }
}

function json(body: ApiResponse, status = 200): Response {
  return Response.json(body, { status });
}
