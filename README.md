# Sylvia's Restaurant Companion

Guests need a clear way to explore restaurant events, menu and drink information, and reservation options. Sylvia's Restaurant Companion brings those workflows together in a Next.js application with a Postgres-backed events and reservations system and an AI concierge.

## What it does

- **Events:** browse restaurant events in Pinboard, Agenda, and Calendar views backed by Postgres.
- **AI concierge:** look up food, drinks, specials, events, hours, and restaurant information; check table availability; and help guests book, cancel, or reschedule standalone table reservations.
- **Reservations:** submit event and large-party/catering reservation requests with validated details.
- **Deposits:** use Stripe Embedded Checkout for package deposits. The app refuses live Stripe keys and is intended for test mode only.
- **Health check:** `GET /api/health` reports application, database, and payment configuration status.

## Tech stack

- Next.js 16 App Router, React 19, and TypeScript
- PostgreSQL through `pg`
- Zod request validation
- Vercel AI SDK with Google Gemini by default or Anthropic when configured
- Stripe.js and Stripe Embedded Checkout for test-mode deposits
- Vitest

## Getting started

**Requirements:** Node.js 22 or newer and a local or hosted PostgreSQL database.

```bash
npm install
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local`, then create the database and apply its schema and seed events:

```bash
createdb sylvias_events
npm run db:migrate
npm run dev
```

Open [http://localhost:3000/events](http://localhost:3000/events). The migration script applies `db/schema.sql` and seeds the six events from `src/lib/seed-data.ts`.

### Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | Database-backed pages and reservations | PostgreSQL connection string. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Concierge with the default Google provider | Required when `CONCIERGE_PROVIDER` is `google` or unset. |
| `CONCIERGE_PROVIDER` | Selecting the concierge provider | `google` (default) or `anthropic`. |
| `CONCIERGE_MODEL` | Selecting a model | Optional; uses the configured provider's default when unset. |
| `ANTHROPIC_API_KEY` | Concierge with Anthropic | Required when `CONCIERGE_PROVIDER=anthropic`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Embedded deposit checkout | Use a Stripe test publishable key (`pk_test_...`). Live keys are rejected. |
| `STRIPE_SECRET_KEY` | Creating deposit checkout sessions | Use a Stripe test secret key (`sk_test_...`). Live keys are rejected. |
| `STRIPE_WEBHOOK_SECRET` | Local or deployed webhook handling | Optional for ordinary browsing; use a test webhook signing secret. |

Menu and event pages can be explored without AI or Stripe keys, but those integrations remain unavailable until their required keys are configured. Never commit real keys.

## Repository notes

`reference/original-static/` holds the original static HTML, CSS, and calendar script that the Next.js application was rebuilt from. These files are not used at runtime. The repository also contains vendored Neon/Postgres agent guidance under `.agents/skills/`.

## Deployment

Point `DATABASE_URL` at a hosted PostgreSQL database and run `npm run db:migrate` once against it. Hosted PostgreSQL providers may require TLS; the database client enables TLS for non-localhost URLs. Production deployment is managed by the project team.
