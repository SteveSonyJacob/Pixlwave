# Pixlwave

Phase 1 foundation for an admin-managed Kerala advertising marketplace. The repository contains a Next.js application, Supabase/PostgreSQL migrations, account and role policies, provider boundaries, a durable outbox worker, tests and architecture contracts.

## Prerequisites

- Node.js 22.13 or newer (required by the pinned Supabase, lint and test packages)
- npm 10 or newer
- A Supabase project in Mumbai (`ap-south-1`), or Docker plus the project-local Supabase CLI for local Auth/PostgreSQL

## First run

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and replace every `change-me` value. Do not commit it. Next.js and the project scripts load this file automatically.
3. For local Supabase, run `npx supabase start`, then copy the printed URL, publishable key, service key and database URL into `.env.local`.
4. Apply the schema with `npm run db:migrate` (or `npx supabase db reset` for the full local stack).
5. Optionally create deterministic local accounts with `npm run seed:auth`.
6. Run the web app with `npm run dev` and the durable worker separately with `npm run worker`.

Visit <http://localhost:3000>. The health endpoint is <http://localhost:3000/api/health>; it returns `503` with named configuration errors until required values are valid.

## Validation

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:test
```

`db:test` is destructive to the database named by `DATABASE_URL`; use only an isolated disposable database. It verifies both a fresh migration and an upgrade from the first foundation revision. CI provides its own PostgreSQL service. Auth delivery tests need allowed test phone/email recipients and a configured Supabase project; mock/unit passes are not provider evidence.

See [Phase 1 contracts](docs/architecture/P01-contracts.md), [operations](docs/operations/P01-foundation.md), and the [Phase 1 handoff](docs/handoffs/P01-foundation-accounts.md).
