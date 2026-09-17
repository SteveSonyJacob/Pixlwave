# P02 handoff - Inventory management

Plan version: 1.0 implementation draft. Updated: 2026-09-17.

Status: IMPLEMENTED; automated application, staging migration/integration and runtime smoke checks pass; provider and manual acceptance gates remain open

Implementation revision: working tree based on `d7cfbb3`

Application tests: 9 files / 22 tests PASS; lint, typecheck, docs, build and client-secret scan PASS

Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R03, R04, R05, R06, R07, R08, R10, R17, R18.  
Entry dependency: P01 accepted and its actual handoff verified.  
Decision/configuration gates: P01 identities/access foundation accepted; verify owner documents, media constraints, approved service promises, initial publication and location provider.

Previous phase: [P01 - Foundation and accounts](P01-foundation-accounts.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Owner onboarding and verification

- [ ] Build owner verification and admin review with server-side checks, database policies, rate limits and privileged audit logs.
- [ ] Build the owner inventory dashboard for drafts, verification/publication states, listing edits and suspension reasons. Admin controls verification/publication; owner accounts cannot publish unapproved rates or bypass review.

### Listings, pricing, media and capacity

- [ ] Build owner listings and admin publication/rejection/suspension for whole-day LED screens, theatre shows with multiple ad slots and mobile vehicles with rotating slots/routes.
- [ ] Capture initial owner base rate, specs, ad duration, number of plays per show/day, operating hours, blackouts, capacity and owner-attributed audience estimates. Owners set service promises per listing and admin approves them before publication. Define the immutable paid-booking snapshot fields and validate them with domain fixtures; P04/P05 implement and rerun the actual snapshot flow.
- [ ] Make subsequent published-price editing admin-only; record owner discussion, old/new price, effective time and reason. Owner suggestions cannot publish a changed rate.
- [ ] Integrate Mappls address search and pin placement for Kerala listings; retain first-party coordinates/locality and applicable route geometry with provider provenance/terms respected.
- [ ] Implement advertiser creative-upload foundations: file type/size checks, scan/quarantine, safe preview, private access and expiring downloads. Specify reusable evidence-storage and retention contracts; P06 implements fulfillment-evidence workflows. Preserve committed-service invariants with domain fixtures until P04/P05 rerun them against bookings.
- [ ] Validate category-specific image/video constraints and service promises before accepting a creative; show dimensions/resolution and a calendar of real show/day/slot capacity.

Parallel sequencing: Owner verification, the three inventory forms, media handling and the admin review UI can proceed against agreed identity/listing schemas. Shared calendar, pricing and media contracts must be integrated before publication tests.

## Integration with previous work

Use P01 accounts, roles, storage/configuration conventions and real database policies. Publish verified test inventory for all categories; public discovery in P03 consumes these exact records and APIs.

Reuse the completed application's identities, data contracts and services. P02 tests involving paid commitments or approved bookings use explicit inventory-domain fixtures because booking/payment do not exist until P04/P05. These fixtures validate listing invariants only; they cannot prove booking or payment integration. P04 must rerun P02-T02, P02-T03, P02-T05 and P02-T06 with its fixture-funded approved-booking flow, and P05 must rerun them with Razorpay sandbox-funded bookings.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P02-T01: Confirm role switching grants no admin privileges and unverified owners cannot publish listings.
- [ ] P02-T02: Using an immutable paid-commitment domain fixture for the downstream-dependent portion, verify draft/verified/published access; require admin approval of owner-specified ad duration, plays per show/day and operating hours. Reject invalid service values and prove owner API edits cannot change published price or the fixture's committed service terms. Rerun with P04 fixture-funded and P05 sandbox-funded bookings.
- [ ] P02-T03: Using approved-booking domain fixtures, test show and rotating-slot capacity, blackout overlap and the no-other-approved-bookings custom-route condition across overlapping vehicle dates. Rerun against P04 approval transactions and P05 sandbox-funded bookings.
- [ ] P02-T04: Reject spoofed/corrupt/oversized uploads and unauthorized downloads; verify scanning, expiring links and safe preview.
- [ ] P02-T05: Check representative Kerala address/pin accuracy, provider failures and price audit history; use a committed-service domain fixture to reject conflicting capacity/route edits, then rerun that protection in P04 and P05.
- [ ] P02-T06: Validate duration, plays and operating hours against available service capacity; use an immutable paid-service domain fixture to preserve committed terms across listing edits, and reject incompatible creative metadata before checkout. Rerun paid-term protection in P04 and P05.
- [ ] P02-T07: Using P01 accounts, create one listing of each category, block publication by unverified owners, complete admin verification/publication and retrieve the same approved records through the read API. Recheck cross-account media and price permissions.

Manual acceptance scenario: An owner creates LED, theatre and mobile inventory; admin verifies the owner, reviews service promises and approves the listings. Review owner dashboard states and admin-only price changes.

Exit gate: Verified owners can manage inventory and admins can publish it securely; all category records are usable by P03. No mocked owner identity or separate duplicate listing store.

## Actual implementation record

- Delivered behavior: owner identity/document submission; admin AAL2 owner review/suspension; owner LED, theatre and mobile listing create/edit/submit; dated blackouts and theatre shows; first-party Kerala pins with Mappls-first/Google-fallback search; admin publication/rejection/suspension; append-only current-rate revisions; approved service snapshots; narrow public inventory API; private owner/creative uploads and authorization-scoped signed downloads; executable capacity, custom-route, media-compatibility and snapshot fixtures. Owners still have no advertiser request queue or published-rate mutation. Booking/payment/real capacity reservation remain in P04/P05 and public discovery remains P03.
- Files/modules changed: `202609170001_inventory_management.sql` plus endpoint-rate-limit/schema-reload migrations; `src/lib/inventory`, `src/lib/media`; owner/admin/advertiser pages and server actions; inventory/maps/media routes; reusable listing/location/upload components; P02 contracts, runbook and acceptance script.
- Branch/commit/build revision and environment URL: uncommitted working tree based on `d7cfbb3`; local runtime at `http://localhost:3000`; configured staging database migrations applied successfully on 2026-09-17 IST.
- Accepted architecture: PostgreSQL/RLS/RPC is the inventory source of truth; public reads use the column-limited `published_inventory` view. Mutation RPCs recheck owner/admin authority and rate-limit actors. Published rates are revisions, not mutable quote history. Media objects are private and metadata/RLS is checked before five-minute signed downloads. See `docs/architecture/P02-inventory-contracts.md`.
- Schemas/migrations and compatibility: five additive P02 migrations (inventory, endpoint limits, schema reload and strict category constraints). `npm run db:migrate` passed against configured staging. `npm run db:test` contains prior-revision/fresh replay plus an inventory workflow, but correctly refused the configured non-disposable database because its name does not contain `pixlwave_test`.
- API/events and permissions: `GET /api/inventory/published`, `GET /api/maps/search`, `POST /api/media/upload`, `GET /api/media/:id/download`; owner/admin changes use server actions backed by authenticated RPCs. No P02 notification event is emitted because P03 owns user communication.
- Configuration: `MAPPLS_SEARCH_URL`, `MAPPLS_ACCESS_TOKEN`, `GOOGLE_GEOCODING_API_KEY`, `MEDIA_PRIVATE_BUCKET`; credentials remain server-only. Existing Mumbai region declarations and Supabase service credentials are reused.
- Provider verification: database connectivity and migrations passed; anonymous public view query passed. Real Mappls/Google searches, storage region/bucket inspection, full malware engine and video media-probe remain unverified.
- Setup/run commands: existing pinned Node/Next/Supabase versions retained. Run `npm run db:migrate`, `npm run dev`, `npm run acceptance:inventory`, and the existing CI commands. Acceptance is forbidden in production and rolls back its database transaction.
- Predecessor integration: P01 identities, AAL2 helper, audit log, RLS conventions and environment validation are used directly. Full P01/P02 unit suite, static checks and build pass.
- Operations/recovery: `docs/operations/P02-inventory.md`; never drop uploaded-object metadata during application rollback, restore database and private objects together, and do not treat the built-in signature/EICAR check as the final production malware service.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

Evidence recorded on 2026-09-17 IST against the working tree based on `d7cfbb3`. The staging acceptance transaction was rolled back and left no sample inventory behind.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P02-T01 | Working tree / unit+staging | Permission tests and `npm run acceptance:inventory` | Role switching grants no admin; unverified owner cannot create/publish | Unverified creation and owner rate change denied; AAL2 admin operations passed | `access.test.ts`; rollback staging trace | PASS |
| P02-T02 | Working tree / unit+staging | Domain snapshot tests; rollback publish flow | Valid service values, admin publication and immutable committed terms | Invalid hours rejected; approved snapshot remains unchanged; owner cannot change published rate | `domain.test.ts`; staging trace | PASS (fixture boundary; P04/P05 rerun due) |
| P02-T03 | Working tree / unit | Capacity/route fixture tests | Shared slot, blackout and custom-route rules | Boundary/overlap/capacity/route cases pass | `domain.test.ts` | PASS (fixture boundary; P04/P05 rerun due) |
| P02-T04 | Working tree / unit+build | Media signature/spoof tests, RLS acceptance and route build | Reject spoof/corrupt; private scoped download | Unit cases and cross-account metadata denial pass; five-minute link route builds | `validation.test.ts`; staging trace; build routes | PASS for foundation; production scanner gate OPEN |
| P02-T05 | Working tree / staging | Kerala schema bounds, provider adapter inspection, admin rate revision acceptance | Kerala pin/provenance, failure behavior, audited rate | Bounds/provenance enforced; provider failure is truthful; admin revision updates public view | migration/domain tests; staging trace | PASS for code; real provider accuracy NOT REVIEWED |
| P02-T06 | Working tree / unit | Service-capacity and creative compatibility cases | Reject impossible service and incompatible creative; preserve snapshots | Duration×plays, resolution/aspect/duration and immutable snapshot cases pass | `domain.test.ts` | PASS (video probe and P04/P05 rerun due) |
| P02-T07 | Configured staging / rollback transaction | `npm run acceptance:inventory` | Verify owner, create/publish all categories, read same projection, enforce validation/privacy/rate permissions | Three categories published; public current rates read; unverified owner, incomplete direct category payload, owner-rate and cross-account media access denied; transaction rolled back | Console output, 2026-09-17 IST | PASS |
| Earlier-phase regression | Working tree | `npm run test`; lint; typecheck; docs; build; client-secret scan | P01 behavior remains valid | 9 files/22 tests plus all static/build checks pass | Console output | PASS |
| Runtime smoke | Local app + configured staging | Request `/`, `/api/inventory/published`, unauthenticated `/owner` | Public routes 200; owner gate redirects | 200, 200 with empty inventory/truthful capacity note, and 307 to sign-in | Console output | PASS |
| Destructive migration replay | Configured non-test database | `npm run db:test` | Refuse unsafe target or pass on disposable DB | Refused because database name does not contain `pixlwave_test` | Console output | BLOCKED (safe refusal) |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Disposable PostgreSQL unavailable | Full destructive prior-revision/fresh replay cannot run against staging | Environment owner | Provide a database whose name includes `pixlwave_test`; run `npm run db:test` | BLOCKED |
| Map provider acceptance open | Credentials/terms/representative Kerala accuracy and fallback were not manually exercised | Provider operator/client | Configure Mappls and Google keys; test representative districts, failure and quota behavior | NOT VERIFIED |
| Production media pipeline open | Built-in signature/EICAR validation does not extract video metadata or replace full malware scanning | Platform operator | Select India-compatible scanner/media probe; verify quarantine, video duration/resolution/codec and retention | BLOCKED FOR VIDEO CHECKOUT |
| Manual/client review absent | Phase exit gate cannot be fully signed off | Client/reviewer | Run owner/admin/advertiser scenario on phone and desktop; record defects and approval | NOT REVIEWED |

Add actual defects with severity, reproduction, affected requirements, owner, mitigation and next-phase impact. Retain operational instructions for deadline jobs, notifications, manual refunds/transfers, reconciliation and restore where applicable.

## Next-phase handoff

Next: [P03 - Discovery and communication](P03-discovery-communication.md).

Required outputs: Approved listing/media schemas and APIs, all-category sample records, owner/admin screens, published-rate and capacity contracts, protected asset access and verification evidence.

Before handoff:

- [ ] Document delivered scope and exact revision.
- [ ] Pass current cases, added integration case and affected earlier regression.
- [ ] Record real manual/client acceptance and unresolved defects.
- [ ] Update schemas/contracts, decision register, setup and recovery instructions.
- [ ] Provide concrete next actions and verify the next phase can use these artifacts.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-15 | 0.8 | Created this current phase through seven-phase consolidation. Previous tests mapped without loss; one integration case added. No implementation or tests executed. |
| 2026-09-15 | 0.9 | Labeled paid/approved commitment checks as inventory-domain fixtures and assigned integrated reruns to P04 and P05. |
