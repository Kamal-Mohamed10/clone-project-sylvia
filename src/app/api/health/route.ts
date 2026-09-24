import { hasDb, sql } from "@/lib/db";

type Health =
  | { ok: true; db: "connected" | "demo-mode" }
  | { ok: false; db: "error"; error: string };

export async function GET(): Promise<Response> {
  if (!hasDb) {
    const body: Health = { ok: true, db: "demo-mode" };
    return Response.json(body);
  }

  try {
    await sql`SELECT 1`;
    const body: Health = { ok: true, db: "connected" };
    return Response.json(body);
  } catch (err) {
    const body: Health = {
      ok: false,
      db: "error",
      error: err instanceof Error ? err.message : "unknown",
    };
    return Response.json(body, { status: 500 });
  }
}
