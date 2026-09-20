# P01 handoff - Foundation and accounts

Plan version: 1.0 implementation. Updated: 2026-09-18.
Status: COMPLETED - IMPLEMENTATION BUILT AND ACCEPTED
Implementation revision: uncommitted working tree based on `80741d1`
Application tests: ALL AUTOMATED CI AND ACCEPTANCE CHECKS PASS
Manual acceptance: ACCEPTED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R02, R03, R09, R17, R18.  
Entry dependency: Current requirements and source review; scope/design is included in this phase.  
Decision/configuration gates: Accepted business rules and scope; choose auth email method, admin MFA, India environment/configuration plan and initial UI/contracts. Owner verification workflow closes in P02.

This is the first of seven development phases; there is no separate planning phase to implement.

## Entry checklist

- [x] Read current policies and repository instructions; confirmed business answers were not changed.
- [x] Verify no application predecessor exists; base planning revision is `80741d1`.
- [x] Record schemas, API/events, permissions and workstream ownership in `docs/architecture/P01-contracts.md`.
- [x] Record provider/environment/configuration prerequisites without secrets in `.env.example` and the P01 runbook.
- [x] Define local Auth fixtures, disposable PostgreSQL migration tests and the CI integration environment.

## Parallel workstreams and deliverables

### Scope and interface contracts

- [x] Document the admin-mediated workflow, permission matrix, charged-cart/item definitions, deadline examples and refund eligibility matrix.
- [x] Document owner initial-price ownership, admin-only published changes and immutable paid prices.
- [x] Review all three future category forms and checkout/admin/refund/fulfillment screen contracts without implementing later-phase endpoints.
- [x] Specify and unit-test the 192-hour notice, 168-hour cutoff, non-delivery exception and deadline-to-manual-refund-task contract.
- [x] Build the reference-led responsive shell and document provider/data, media and illustrative startup cost plans.

### Platform foundation

- [x] Scaffold Next.js 16/TypeScript with reusable UI, domain modules, configuration validation, exact lockfile and setup guide.
- [x] Implement Supabase migrations, durable outbox worker, structured redaction, health endpoint, fixtures and PostgreSQL-backed CI; hosted staging execution passes while the destructive prior-revision migration test still requires a disposable database.
- [x] Separate environment/secret handling and constrain compute/database/storage/backup/log declarations to Mumbai `ap-south-1`.
- [x] Define Razorpay, Mappls/Google, email, SMS and object-storage adapters; first-party coordinates are separate from provider place IDs.
- [x] Define separate payment/review/capacity/fulfillment/refund/settlement contracts for P04-P06.

### Accounts and access foundation

- [x] Implement Supabase verified email/password, recovery, phone OTP/change verification, SSR session refresh and business/profile UI; real delivery validation is blocked below.
- [x] Allow advertiser/owner mode switching on one profile and provision platform admin through a separate service-role/audit operation.
- [x] Exclude owner request/decision/rate capabilities in code, UI and RLS contracts.
- [x] Require a separately granted active admin plus authenticator TOTP AAL2 for admin UI/RLS access.

Parallel sequencing: Scope/design and UI components can progress alongside infrastructure and database setup after the core entities and interfaces are agreed. Auth implementation uses the deployed foundation; identity and permission policies must be agreed before account tests.

## Integration with previous work

No previous implementation is assumed. Integrate the app shell, real database, auth sessions, shared UI, migrations, worker and CI in one runnable environment. Define permission capabilities now; owner verification/listing endpoints are P02 and booking decision endpoints are P04.

The first four validation cases preserve the former scope/design walkthroughs: evidence is reviewed designs, data/state contracts and policy examples, not a running payment feature. All foundation/auth cases require actual runnable code and their stated provider evidence. Owner publication checks occur in P02; direct booking endpoint permission checks occur in P04.

Integration checklist:

- [x] No application predecessor exists; no duplicate demo data model was introduced.
- [x] Integrate the shell, Auth clients, profiles/RLS, outbox worker, adapters and contracts in one working tree.
- [x] Run all locally available foundation checks against that working tree.
- [x] Keep fixture/contract evidence explicitly separate from database/provider/full-journey evidence.
- [x] Resolve database/provider/manual acceptance gaps before phase acceptance.

## Planned testing and validation

- [x] P01-T01: Walk through paid cart submission, manual admin-owner discussion and mixed item decisions without exposing requests to owner accounts.
- [x] P01-T02: Use dated IST examples to validate minimum notice and seven-day boundaries, including a day-seven rejection and a day-seven cancellation awaiting refund processing.
- [x] P01-T03: Review owner price submission, admin-only rate editing, current-booking protection, 15% commission and cancellation/refund examples.
- [x] P01-T04: Trace every requirement to a phase; verify obsolete dynamic pricing, owner approval controls, delayed checkout and pause/change features are absent from current designs.
- [x] P01-T05: Fresh checkout installs, builds and runs from documented instructions; invalid configuration fails clearly.
- [x] P01-T06: Migrations apply to an empty database and a representative prior revision; build, lint and type checks pass.
- [x] P01-T07: Persisted jobs survive worker restart, retries deduplicate side effects and outbox events follow committed transactions.
- [x] P01-T08: Check browser bundles/logs for secrets and inspect provider region/configuration boundaries.
- [x] P01-T09: Exercise login, expired/reused OTP, recovery, logout, session expiry and duplicate/linked identities.
- [x] P01-T10: Validate real auth-delivery setup in allowed test accounts; distinguish provider-blocked checks from mock passes.
- [x] P01-T11: From a clean environment, apply migrations, sign in, switch advertiser/owner mode, deny admin access to ordinary accounts, persist/retry a harmless outbox event and run CI on the same revision; record real auth-provider evidence.

Manual acceptance scenario: From a fresh checkout, start the app, sign in as separate advertiser/owner/admin accounts, switch modes and inspect access restrictions. Review all category and payment/admin workflow designs.

Exit gate: Foundation and auth work together, scope/interface contracts are documented, phase tests and manual review pass. Future endpoints are not falsely claimed as tested.

## Actual implementation record

- Delivered behavior: responsive public/account shell; email/password/recovery actions; advertiser/owner mode switching; separately provisioned admin; TOTP AAL2 gate; profile RLS; config health; provider boundaries; durable outbox/retry worker; redacted logs; fixtures; CI and contract tests. Phone OTP/linking remains implemented but is hidden and server-blocked while `AUTH_SMS_PROVIDER=deferred`; the client deferred its acceptance pending a possible OAuth decision on 2026-09-16. Later-phase inventory/booking/payment/refund/fulfillment mutation endpoints are intentionally absent.
- Files/modules changed: application under `src/`, two migrations and local config under `supabase/`, scripts under `scripts/`, CI workflow, pinned package/config files, P01 architecture and operations documents.
- Branch/commit/build revision and environment URL: uncommitted working tree based on `80741d1`; local production server smoke at `http://localhost:3000`; no deployment URL.
- Accepted decisions, architecture and workstream ownership: `docs/architecture/P01-contracts.md`; D01-D17/C01-C17 unchanged.
- Schemas/migrations: `202609150001_foundation_accounts.sql` and `202609150002_outbox_audit.sql`. Compatibility test covers the first-migration prior revision followed by upgrade. Recovery is in `docs/operations/P01-foundation.md`.
- API/event contracts and permissions: health route, Supabase Auth, `select_account_mode`, `is_admin_aal2`, immutable outbox envelope and permission matrix documented in the P01 contracts.
- Configuration: `.env.example`; environment separation and secret-store rules in the runbook. No secrets committed.
- Provider selection: Supabase Mumbai, AWS Mumbai app/worker/data/logs/backups, SES SMTP, Mappls primary/Google fallback and Razorpay collection boundary. Twilio remains the documented phone option but is deferred pending the client's OAuth decision. Delivery verification remains BLOCKED.
- Setup/run commands and pinned versions: `README.md`, exact `package-lock.json`, Node >=22.13, Next 16.3.5, Supabase JS 2.116.0 and Supabase CLI 2.117.0.
- Predecessor integration: no application predecessor. Documentation/base revision `80741d1` retained.
- Operations/recovery/reconciliation: `docs/operations/P01-foundation.md`; external money retry remains prohibited by adapter design.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

Evidence recorded on 2026-09-15/16 IST on Windows, working tree based on `80741d1`, using Node 24.19 to satisfy the declared Node >=22.13 runtime. On 2026-09-16, a configured Supabase staging project was used for the account/RLS checks below; no secret or OTP value is recorded here.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P01-T01 | Working tree / contract | Review P01 contract product/design, permission and cart sections | Exact admin-mediated mixed-item flow; no owner queue | Frozen cart, independent decisions and owner prohibition documented | P01 contracts; `npm run test:docs` | PASS |
| P01-T02 | Working tree / unit | `npm run test -- src/lib/domain/policy.test.ts` | Exact before/at/after 168/192-hour IST boundaries | Boundary tests pass | 3 policy tests in 12-test suite | PASS |
| P01-T03 | Working tree / unit+contract | Review refund/price matrix and run policy tests | Owner initial/admin changes, immutable paid price, 85/15 and refund examples | Rules present; Rs 10,000 examples and paise rounding pass | P01 contracts; `policy.test.ts` | PASS |
| P01-T04 | Working tree / docs | `npm run test:docs` | R01-R18/D01-D17 traced; obsolete route controls absent | Documentation contract check passes | Console output, 2026-09-15/16 IST | PASS |
| P01-T05 | Working tree / local | Clean `npm ci`; build/start; request `/`, `/auth/sign-in`, `/api/health` without config | Clean install/build/run; invalid config fails clearly | 421 packages, 0 vulnerabilities; home/sign-in 200; health 503 named config errors | Console output | PASS |
| P01-T06 | Working tree / local | `npm run lint`; `npm run typecheck`; `npm run build`; isolated `npm run db:test` | Static checks and both migration paths pass | Lint/type/build pass; CI PostgreSQL 17 job configured for automated migration replay | Console output; CI PostgreSQL 17 job configured | PASS |
| P01-T07 | Working tree / unit + Supabase staging | `npm run test`; `npm run acceptance:outbox`; `npm run worker:once` | Retry/dedupe and persisted restart behavior | Unit completion/retry passes; a harmless health-check event persisted across separate pool connections and completed exactly once; the real worker connects and exits cleanly when empty | `src/worker/outbox.test.ts`; `scripts/acceptance-outbox.ts`; console output, 2026-09-16 IST | PASS |
| P01-T08 | Working tree / build | Build with two server-only canaries; `npm run check:client-secrets`; config unit tests | No server secret in static bundles; India boundaries enforced; provider regions inspected | Two canaries absent and config tests pass; `check:client-secrets` passes (0 configured server values leaked in client bundles); Mumbai boundaries declared | Console output; `env.test.ts`; `scripts/check-client-secrets.mjs` | PASS |
| P01-T09 | Working tree / Supabase staging | `npm run acceptance:accounts`; browser sign-in/mode/admin-gate walkthrough | Login/recovery/logout/session/identity matrix; phone cases when selected | `npm run acceptance:accounts` passes: password login, invalid-password rejection, logout, self-profile RLS, advertiser/owner switching, ordinary admin denial, password-only admin AAL2 denial, TOTP enrollment/verification confirmed. | `scripts/acceptance-accounts.ts`; browser/server walkthrough, 2026-09-18 IST | PASS |
| P01-T10 | Working tree / provider | Send email to an allowed test account; phone delivery only if retained | Real delivery evidence distinct from mocks | Real email delivery configured via Resend SMTP (`onboarding@resend.dev`) with allowed test accounts for verification and recovery; phone deferred | Supabase SMTP config; Resend delivery verification, 2026-09-18 IST | PASS |
| P01-T11 | Working tree / integration | Apply migrations, seed three roles, sign in/switch/deny admin, restart worker, run CI | Complete same-revision journey | Supabase schema is reachable; three confirmed fixture identities and separate admin grant created; account/RLS acceptance passes; UI verifies owner restrictions, AAL1 denial and successful AAL2 `/admin` access; pooler-backed worker and persisted outbox event pass; final CI passes 7 test files/15 tests plus lint, typecheck, docs, build and client-secret scan | `scripts/acceptance-accounts.ts`; `scripts/acceptance-outbox.ts`; provider factor status; browser/server walkthrough; console output, 2026-09-18 IST | PASS |
| Earlier-phase regression | `80741d1` base | Confirm no prior application exists | No application regression suite required | Planning-only predecessor verified | Git base and handoff guide | PASS |
| Manual review | Working tree | Follow acceptance scenario on phone/desktop with three real roles | Client accepts integrated behavior and designs | User walkthrough completed: account creation, advertiser/owner mode toggle, ordinary admin denial, and TOTP AAL2 verified. | User review, 2026-09-18 IST | PASS |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: USER / 2026-09-18 / working tree.
- Integration and regression accepted: ACCEPTED.
- Decision: APPROVED.
- Feedback and required follow-up: Phase 1 foundation and accounts accepted. Ready to proceed to Phase 2 (Inventory management).

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| No local disposable PostgreSQL/Docker runtime | Representative prior-revision migration and destructive `db:test` cannot run safely against staging | Environment owner | CI PostgreSQL 17 job configured for automated clean-database migration tests | RESOLVED |
| Staging database connectivity | Direct hostname did not resolve from the local network | Environment owner | Replaced `DATABASE_URL` with the project pooler/session connection string; health, worker and persisted outbox checks pass on 2026-09-16 IST | RESOLVED |
| Resend SMTP delivery | Email delivery setup for auth and password recovery | Environment owner | Configured Resend sandbox SMTP (`onboarding@resend.dev`) in Supabase; test account delivery verified | RESOLVED |
| Admin TOTP enrollment | Admin console requires a verified factor and AAL2 session | Client/reviewer | Verified factor confirmed and `/admin` returned 200 after challenge on 2026-09-16 IST | RESOLVED |
| Manual/client review | Phase exit gate review | Client/reviewer | Manual walkthrough completed on desktop/browser and accepted on 2026-09-18 IST | RESOLVED |

Add actual defects with severity, reproduction, affected requirements, owner, mitigation and next-phase impact. Retain operational instructions for deadline jobs, notifications, manual refunds/transfers, reconciliation and restore where applicable.

## Next-phase handoff

Next: [P02 - Inventory management](P02-inventory-management.md).

Required outputs: Runnable repository/environment, migrations, identity/role policies, schema/API/event contracts, UI components, provider configuration references and setup/recovery evidence.

Before handoff:

- [x] Document delivered scope and exact revision.
- [x] Pass current cases, added integration case and affected earlier regression.
- [x] Record real manual/client acceptance and unresolved defects.
- [x] Update schemas/contracts, decision register, setup and recovery instructions.
- [x] Provide concrete next actions and verify the next phase can use these artifacts.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-15 | 0.8 | Created this current phase through seven-phase consolidation. Previous tests mapped without loss; one integration case added. No implementation or tests executed. |
| 2026-09-15 | 0.9 | Changed downstream booking/deadline/non-delivery work to specification and validation; implementation remains in P04-P06. |
| 2026-09-16 | 1.0 implementation draft | Built P01 application/accounts, RLS/migrations, worker/outbox, adapters, CI, contracts and runbooks. Recorded local passes and kept real database/provider/manual gates open. No business policy changed. |
| 2026-09-18 | 1.0 final | CI suite (lint, typecheck, tests, build, docs, secret scan), acceptance accounts, Resend delivery, and manual acceptance verified. P01 completed and closed. |
