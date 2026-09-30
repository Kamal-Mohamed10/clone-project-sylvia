/**
 * Seeds a handful of standalone table reservations (concierge-chatbot style
 * bookings: event_id NULL, reservation_time set) for demo purposes.
 * Run with: node --experimental-strip-types scripts/seed-demo-reservations.mjs
 * (requires DATABASE_URL in the environment)
 */
import pg from "pg";

const DINERS = [
  { name: "Maya Thompson", email: "maya.thompson@example.com", phone: "212-555-0101", party: 2, date: "2026-10-02", time: "18:00", notes: "Anniversary dinner, window seat if possible" },
  { name: "Derek Osei", email: "derek.osei@example.com", phone: "347-555-0177", party: 4, date: "2026-10-02", time: "19:30", notes: null },
  { name: "Priya Chandra", email: "priya.chandra@example.com", phone: "917-555-0142", party: 3, date: "2026-10-03", time: "12:30", notes: "Gospel brunch" },
  { name: "James Whitfield", email: "j.whitfield@example.com", phone: "646-555-0119", party: 6, date: "2026-10-03", time: "18:30", notes: "Birthday party, bringing a cake" },
  { name: "Latoya Brooks", email: "latoya.brooks@example.com", phone: "718-555-0188", party: 2, date: "2026-10-04", time: "13:00", notes: null },
  { name: "Samuel Nguyen", email: "samuel.nguyen@example.com", phone: "212-555-0164", party: 5, date: "2026-10-05", time: "19:00", notes: "One vegetarian in the party" },
  { name: "Angela Reyes", email: "angela.reyes@example.com", phone: "929-555-0155", party: 2, date: "2026-10-07", time: "20:00", notes: null },
  { name: "Marcus Bell", email: "marcus.bell@example.com", phone: "347-555-0133", party: 8, date: "2026-10-08", time: "18:00", notes: "Work team dinner" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL set. Aborting.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  console.log(`Seeding ${DINERS.length} demo table reservations…`);
  const ids = [];
  for (const d of DINERS) {
    const { rows } = await pool.query(
      `INSERT INTO reservations
         (event_id, guest_name, email, phone, party_size, reservation_date,
          reservation_time, notes, status, payment_status)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, 'booked', 'not_required')
       RETURNING id, guest_name, reservation_date, reservation_time, party_size`,
      [d.name, d.email, d.phone, d.party, d.date, d.time, d.notes],
    );
    ids.push(rows[0]);
    console.log(`  #${rows[0].id}  ${d.name} — ${d.date} ${d.time}, party of ${d.party}`);
  }

  console.log("Done.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
