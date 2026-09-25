import { ReservationSchema } from "@/lib/validators";
import { createReservation } from "@/lib/reservations";
import { getEventById } from "@/lib/events";
import { findPackageMenu } from "@/lib/packages";

type ApiResponse =
  | { success: true; id: number; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function POST(request: Request): Promise<Response> {
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

  // Ensure the event actually exists (FK safety + friendly error).
  const event = await getEventById(parsed.data.eventId);
  if (!event) {
    return json({ success: false, error: "That event could not be found." }, 404);
  }

  try {
    const id = await createReservation(parsed.data);
    const found = parsed.data.packageId
      ? findPackageMenu(parsed.data.packageId)
      : null;
    return json({
      success: true,
      id,
      message: `Table reserved for ${parsed.data.partySize}${
        found ? ` · ${found.menu.name}` : ""
      } — see you at Sylvia's!`,
    });
  } catch (err) {
    console.error("Failed to create reservation:", err);
    return json(
      { success: false, error: "Something went wrong saving your reservation." },
      500,
    );
  }
}

function json(body: ApiResponse, status = 200): Response {
  return Response.json(body, { status });
}
