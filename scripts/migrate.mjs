/**
 * Applies db/schema.sql and seeds the events table from src/lib/seed-data.ts.
 * Run with: npm run db:migrate  (requires POSTGRES_URL in the environment)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { sql } from "@vercel/postgres";
import { SEED_EVENTS } from "../src/lib/seed-data.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.error("No POSTGRES_URL / DATABASE_URL set. Aborting.");
    process.exit(1);
  }

  const schema = readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  console.log("Applying schema…");
  await sql.query(schema);

  console.log(`Seeding ${SEED_EVENTS.length} events…`);
  for (const e of SEED_EVENTS) {
    await sql`
      INSERT INTO events
        (id, slug, title, description, start_date, start_time, end_time, day_label, recurring, image_url)
      VALUES
        (${e.id}, ${e.slug}, ${e.title}, ${e.description}, ${e.startDate},
         ${e.startTime}, ${e.endTime}, ${e.dayLabel}, ${e.recurring}, ${e.imageUrl})
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        day_label = EXCLUDED.day_label,
        recurring = EXCLUDED.recurring,
        image_url = EXCLUDED.image_url
    `;
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
