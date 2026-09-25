import "server-only";
import { Pool, type QueryResultRow } from "pg";

/**
 * A single shared node-postgres pool. Works against a local Postgres in
 * development and any standard Postgres (e.g. Neon) in production.
 * The pool is cached on globalThis to survive Next.js dev hot-reloads.
 */
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

export const hasDb: boolean = Boolean(process.env.DATABASE_URL);

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon and other hosted providers require TLS; local Postgres does not.
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return globalForPg._pgPool;
}

/** Parameterized query helper. Never interpolate user input into `text`. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params as never[]);
  return result.rows;
}

/** Closes the shared pool. Intended for test teardown / graceful shutdown. */
export async function endPool(): Promise<void> {
  if (globalForPg._pgPool) {
    await globalForPg._pgPool.end();
    globalForPg._pgPool = undefined;
  }
}
