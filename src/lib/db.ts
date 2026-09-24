import { sql } from "@vercel/postgres";

/**
 * True when a Postgres connection string is present in the environment.
 * Until Vercel/Neon is provisioned we run in "demo mode": events are
 * served from seed data and reservations are persisted to a local JSON
 * file so the full flow is demonstrable without a database.
 */
export const hasDb: boolean = Boolean(
  process.env.POSTGRES_URL || process.env.DATABASE_URL,
);

export { sql };
