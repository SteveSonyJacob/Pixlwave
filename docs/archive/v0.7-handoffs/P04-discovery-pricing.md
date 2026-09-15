> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P04 handoff - Discovery and admin-controlled pricing

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R04, R08, R18.  
Dependencies: P03.  
Decision gates: D04 initial rate publication/effective-time details; D01 confirmed timestamp boundaries; D11 Kerala launch and D16 Mappls accepted.

Previous phase: [P03 - Inventory, owner base prices, and media](P03-inventory-media.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Build Kerala-first homepage/search/map/details, featured inventory, city/locality/category/date/budget filters, responsive navigation and clear availability labels. Details include listing images, dimensions/resolution, pin/address, owner-attributed audience estimates, published unit prices and an availability calendar.
- [ ] Display fixed current admin-published day/show/slot rates; calculate totals from dated units. No demand or nearby-screen price adjustment service.
- [ ] Create immutable quote/paid-line price snapshots, rate versions and customer-visible price-change checks before payment; admin changes affect future quotes only.
- [ ] Use Mappls markers/clustering and owner-defined route display through the provider adapter; pricing uses listing rates and booking units, not map traffic/demand.
- [ ] Keep geography extensible for later states while enforcing Kerala launch inventory eligibility.

- [ ] Provide complete source-blueprint listing details and calendar states; keep state selection Kerala-only at launch and display no fake audience or live-availability claims.

## Planned testing and validation

- [ ] P04-T01: Verify search/filter/map/detail agreement, supported geography, clustering, empty/loading/quota failure states and restricted API keys.
- [ ] P04-T02: Check totals for days/shows/slots, quantities and paise rounding; changing request counts, bookings or nearby prices must not change a published rate.
- [ ] P04-T03: Change the published rate before checkout and require an updated visible quote; after payment prove admin edits never reprice the submitted item.
- [ ] P04-T04: Review keyboard/screen-reader flow and mobile layouts; verify switching the map adapter does not alter booking or price data.

- [ ] P04-T05: Check image preview, dimensions/resolution, location pin, dated availability, price unit and attributed audience estimate on phone and desktop; date filters and the calendar must agree.

Manual acceptance scenario: Compare discovery with UI references and verify an owner's base price, admin price revision and booked-price protection.

Exit gate: Kerala discovery and fixed pricing work; no obsolete dynamic-pricing behaviour remains.

## Actual implementation record

Fill when work starts:
- Delivered behaviour: NOT IMPLEMENTED.
- Files/modules changed: NONE.
- Branch and commit/revision: NOT AVAILABLE.
- Deployment/build identifier and environment URL: NOT AVAILABLE.
- Architecture changes and accepted decision IDs: NOT RECORDED.
- Schema/migrations and command sequence: NOT CREATED.
- Data compatibility and existing-record impact: NOT ASSESSED.
- API/event contracts and example payloads: NOT CREATED.
- Permissions/access policies: NOT IMPLEMENTED.
- Configuration variable names and secret-store references: NOT CONFIGURED.
- Setup and run commands, exact versions: NOT ESTABLISHED.
- Provider accounts/region verification: NOT VERIFIED.
- Recovery/rollback or forward-fix steps: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal details, bank credentials, or secret values here.

## Validation evidence

These are unexecuted checks, not completed results.

| Check | Revision/environment | Command or manual steps | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P04-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P04-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Manual review | Not available | Follow acceptance scenario | Client accepts behaviour | Not reviewed | None | NOT REVIEWED |

Record execution date/time, fixture, role, browser/device and report/trace/screenshot path. Keep blocked or failing checks visible. A simulated funded fixture does not prove gateway integration.

## Manual sign-off

- Reviewer/date: NOT ASSIGNED / NOT REVIEWED.
- Revision/environment: NOT AVAILABLE.
- Feedback: NOT RECORDED.
- Decision: NOT APPROVED.
- Required follow-up: NOT RECORDED.

## Issues and operations

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| Remaining phase gates | See decision gates above | Client for policy; developer for verification | Resolve accepted parameter/provider requirements | OPEN |
| No implementation | Phase features not delivered | Future developer | Complete scope and validation | NOT STARTED |

During implementation, record defects with severity, reproduction, affected requirements and next-phase impact. Add setup/configuration, migration recovery, alerts, expiry jobs and manual refund queues, retries, money reconciliation, provider escalation, retention and costs as applicable. Current operational state: NOT IMPLEMENTED.

## Next-phase handoff

Next: [P05 - Cart, capacity, and admin review domain](P05-booking-cart.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

Before transfer:
- [ ] Delivered scope and actual revision documented.
- [ ] Required checks passed with evidence; exceptions explicitly recorded.
- [ ] User/client manual review recorded.
- [ ] Accepted decisions reflected in the plan and register.
- [ ] Recovery/operations and next actions are reproducible.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-14 | Initial draft | Created phase template; no implementation/tests. |
| 2026-09-14 | 0.4 | Rewrote planned scope/checks for latest admin-managed workflow and follow-up answers. Prior workflow specifications superseded; actual implementation remains absent. |
