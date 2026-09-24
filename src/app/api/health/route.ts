import { hasDb, query } from "@/lib/db";

export async function GET(): Promise<Response> {
  if (!hasDb) {
    return Response.json(
      { ok: false, db: "unconfigured", error: "DATABASE_URL is not set" },
      { status: 500 },
    );
  }
  try {
    const rows = await query<{ count: string }>("SELECT COUNT(*) AS count FROM events");
    return Response.json({ ok: true, db: "connected", events: Number(rows[0].count) });
  } catch (err) {
    return Response.json(
      { ok: false, db: "error", error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
