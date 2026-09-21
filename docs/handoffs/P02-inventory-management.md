# P02 handoff - Inventory management

Plan version: 1.0 draft. Updated: 2026-09-21.
Status: IN PROGRESS — location/map slice complete
Implementation revision: current working tree
Application tests: 3 map tests PASS; lint and production build PASS
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
- [x] Integrate user-triggered Nominatim address search and MapLibre pin placement for Kerala listings; retain first-party coordinates/locality and applicable route geometry with provider provenance/terms respected.
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

- Delivered behavior and omitted scope: OpenStreetMap/Nominatim Kerala search, MapLibre click/drag pin placement and provenance storage are implemented. Other P02 work remains outside this slice.
- Files/modules changed: map search route, location picker/map, map utilities, inventory domain/configuration, styles and tests.
- Branch/commit/build revision and environment URL: current working tree; no deployed URL recorded.
- Accepted decisions, architecture and workstream ownership: D16/C16 changed to OpenStreetMap + MapLibre GL JS.
- Schemas/migrations, compatibility and recovery commands: `supabase/migrations/202609190001_openstreetmap_provider.sql` converts legacy providers; not applied to a linked environment.
- API/event contracts, example payloads and permissions: authenticated `GET /api/maps/search?q=...`; existing Supabase map-search rate check retained.
- Configuration names and secret-store references: `MAPS_PRIMARY_PROVIDER`, `OSM_NOMINATIM_URL`, `NEXT_PUBLIC_OSM_TILE_URL`, optional `MAPS_CONTACT_EMAIL`; no map secret required.
- Provider account/region verification: public endpoint policies reviewed; production endpoint capacity and Kerala manual acceptance remain NOT VERIFIED.
- Setup/run commands and pinned versions: documented in `README.md`; MapLibre worker copied by predev/prebuild hooks.
- Predecessor integration and regression evidence: NOT RECORDED.
- Operations/recovery/reconciliation instructions: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

These checks are planned, not executed.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P02-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P02-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Earlier-phase regression | Not available | List affected case IDs and rerun steps | Previous behavior remains correct | Not executed | None | NOT RUN |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| No implementation | Phase functionality not delivered | Future developer | Build and validate all workstreams | NOT STARTED |
| Configuration/provider checks | See entry gates | Assigned implementer/operator | Record real setup and verification | NOT VERIFIED |
| Integration evidence | Previous/current behavior not demonstrated | Phase implementer | Execute current tests and affected regression | NOT RUN |

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
