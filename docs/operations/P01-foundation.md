# P01 setup, operations and recovery

Updated: 2026-09-16. Do not place secrets, OTPs, customer data, bank references or access tokens in this document, commits, screenshots or logs.

## Environments and secrets

Use separate Supabase projects, AWS resources, provider accounts/credentials and deployment secret scopes for local/test, staging and production. Local values live only in `.env.local`; staging/production values live in their deployment secret manager. Public variables are limited to the Supabase URL/publishable key and application URL. Service-role, database, SMTP, SMS, maps server keys and future Razorpay secrets are server-only.

Every main-data region variable must be `ap-south-1`. Run `/api/health` after deployment. A `503 configuration_error` is a failed deployment gate, not a warning to ignore. Inspect `.next/static` with `npm run check:client-secrets` after every production build.

## Local setup

1. Install Node.js 22.13+ and npm 10+.
2. Run `npm ci`.
3. Install/start Docker Desktop or a Docker-compatible runtime, then run `npx supabase start`.
4. Copy `.env.example` to `.env.local`, enter the local values printed by Supabase and choose non-placeholder provider names. Never commit the file.
5. Run `npx supabase db reset` or `npm run db:migrate`.
6. Set a temporary `FIXTURE_PASSWORD` in the current shell and run `npm run seed:auth`. Remove the variable afterwards.
7. Run `npm run dev` and, in a second process, `npm run worker`.

The local Auth mail sink is Inbucket. A real P01 provider pass must instead use an allowed staging account with custom SES SMTP and Google OAuth configured.

## Supabase/Auth configuration gate

Create the hosted project in the explicit South Asia (Mumbai) region. Configure the application URL and exact callback allowlist. Enable email/password with confirmation and secure password change, Google OAuth, refresh-token rotation and a one-hour JWT expiry. In Google Cloud, configure a Web OAuth client with the Supabase callback `https://<project-ref>.supabase.co/auth/v1/callback`; in Supabase, enable Google and store its client ID/secret there. Configure SES SMTP with a verified sender/domain. Phone OTP remains disabled unless a later client decision selects a TRAI DLT-compliant SMS provider.

Test: email signup/confirmation, password login, invalid login, recovery single use, logout, expired session, Google first sign-in, existing-email identity linking and duplicate identity handling, and delivery to allowed Gmail accounts. Record timestamps and provider message IDs only; never record the content/token.

## Administrator access

Users cannot self-select admin. An authorized operator resolves the exact verified Auth UUID, then runs:

`npm run admin:access -- grant <user-uuid> <operator-uuid>`

The service role creates the separate grant and append-only audit row. The new admin signs in and enrolls an authenticator at `/account/security`; `/admin` remains blocked until the session reaches AAL2. Suspension uses `npm run admin:access -- suspend ...`. Rotate the service-role secret if it is ever exposed.

## Migrations and rollback

Migrations are forward-only, ordered files under `supabase/migrations`. Before staging/production, capture a provider backup, run `npx supabase db push --dry-run`, review, apply and verify schema/RLS. `npm run db:test` destroys only a disposable database whose name includes `pixlwave_test`; it tests a representative P01 revision upgrade and an empty replay.

P01 recovery is forward repair: restore the last known database backup into an isolated Mumbai environment, apply missing migrations, verify Auth profiles/admin grants/outbox/audit counts, reconcile external provider activity since the backup, then switch traffic. Never delete audit records or blindly repeat an uncertain future money movement. Supabase database backup excludes Storage objects, so object restore is a separate procedure.

## Worker recovery and monitoring

Run one or more worker processes against the same database. Each event has a unique dedupe key. Workers claim with `FOR UPDATE SKIP LOCKED`; a crash leaves a processing lock that is returned to available after 15 minutes. Failures back off exponentially and become `dead` at `max_attempts`. Restarting a worker does not erase jobs.

Monitor counts/age for available, processing and dead events; worker heartbeat/crashes; oldest review-deadline event in later phases; and configuration health. Operators investigate `dead` events and enqueue an audited replacement/deduplicated retry only after determining whether the side effect happened. No worker code may execute refunds or owner transfers.

## CI and evidence

CI runs a PostgreSQL 17 service, both migration paths, lint, TypeScript, unit tests, production build and browser-bundle secret scan on the same checkout. Local lack of Docker or real provider credentials is BLOCKED provider evidence, not a pass. Manual review must record the revision, browser/device, role/account fixture, provider mode and observed restrictions.
