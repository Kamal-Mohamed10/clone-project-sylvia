# Sylvia's — Events Page (Next.js + SQL)

A faithful clone of Sylvia's Restaurant events page, rebuilt on Next.js 16
(App Router) with a full Postgres backend and an event **reservation system**
(captures party size).

- **Look:** the original markup + Sylvia's own stylesheet (`public/vendor/sylvias.css`)
  plus the same CDN stylesheets the live site uses — so the page renders identically.
- **Data:** events and reservations both come from Postgres (node-postgres / `pg`).
  The events page (`/events`) renders the Pinboard / Agenda / Calendar views from
  DB rows; the Calendar grid is generated from the data.
- **Reservations:** the native event modal hosts a party-size reservation form that
  POSTs to `/api/reservations` (Zod-validated, parameterized `INSERT`).

## Local development

Requires a local Postgres (e.g. Postgres.app). Set the connection string:

```bash
# .env.local
DATABASE_URL=postgresql://<user>@localhost:5432/sylvias_events
```

Create the database, then apply the schema + seed the six events:

```bash
createdb sylvias_events
npm install
npm run db:migrate     # applies db/schema.sql and seeds events from src/lib/seed-data.ts
npm run dev            # http://localhost:3000/events
```

Health check: `GET /api/health` → `{ ok, db, events }`.

## Deploy

Point `DATABASE_URL` at a hosted Postgres (e.g. Neon). `pg` connects to both
local and hosted Postgres; hosted providers use TLS automatically. Run
`npm run db:migrate` once against the production database. Deploy is handled by
the team (not from a personal Vercel account).
