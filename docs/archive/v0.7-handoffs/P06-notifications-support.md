> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P06 handoff - Notifications, admin reminders, and support

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R16, R02.  
Dependencies: P05 event contracts and P02 identities; real payment triggers connected in P07.  
Decision gates: D09 delivery providers; D01 confirmed 192-hour notice / 168-hour cutoff. Payment-origin deadlines, automatic rejection and manual refund task creation are confirmed.

Previous phase: [P05 - Cart, capacity, and admin review domain](P05-booking-cart.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Deliver payment-received, admin-review, acceptance/rejection, cancellation, refund, fulfillment and support events through in-app/email/SMS as appropriate to role.
- [ ] Send admin deadline reminders and notifications for deadline rejection and pending manual refunds at seven days. Show actual advertiser cancellation eligibility and refund status.
- [ ] Use durable outbox delivery, idempotency, retry/backoff, bounce/failure tracking and accurate links; notification delays never silently extend eligibility.
- [ ] Implement booking-linked support tickets, attachments, admin replies and private internal notes. Customer requests and creatives are not automatically forwarded to owners.
- [ ] Use ordinary Gmail/other recipient delivery with configured SMTP/SMS providers; no waiting-to-pay or 48-hour countdown campaigns.

- [ ] Use ticket states open/in-progress/resolved/closed with audited replies and private notes; show notification delivery status separately from booking state. Scheduled-start notices never claim verified playback.

## Planned testing and validation

- [ ] P06-T01: Check recipient/channel routing and confirm owners receive neither raw booking requests nor customer/admin private notes.
- [ ] P06-T02: Test duplicate events, email bounce, SMS timeout and worker recovery without lost/duplicate business actions.
- [ ] P06-T03: Verify IST timestamps, admin due/overdue reminders, paid-awaiting-review wording and notifications after actual refund outcome.
- [ ] P06-T04: Attempt cross-account ticket/media access; receive real provider test messages and record any blocked external validation.

- [ ] P06-T05: Start a scheduled campaign window with no evidence: notify only its scheduled status, never observed playback or verified completion. Confirm resolved tickets retain authorized reply history and private notes stay private.

Manual acceptance scenario: Receive paid/request-decision/refund notices, review an admin due alert and resolve a ticket using separate accounts.

Exit gate: Required event delivery and support are correct; provider-backed delivery evidence is recorded.

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
| P06-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P06-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P07 - Upfront grouped payment and rejection refunds](P07-payments-ledger.md). Deliver the schema/contracts, configuration references, fixtures and evidence it needs.

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
