> HISTORICAL v0.7 HANDOFF - superseded by the seven-phase v0.8 plan. Do not implement from this file or treat its phase/test IDs as current. Use [current phase mapping](../../phase-mapping.md) and [active handoffs](../../../handoff.md). Original test descriptions below are retained for provenance; relative source links were adjusted for this archive.

# P11 handoff - Client acceptance and production release

Plan version: 0.7 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Context and current authority

Read [the plan](../../../plan.md), [handoff guide](../../../handoff.md) and [decision register](../../decisions.md). This v0.7 specification replaces earlier workflow assumptions; previous tests were never run. Review [blueprint coverage and resolved answers](../../requirements-review.md) and plan sections 3.6-3.8 before implementing checkout, media or money records.

Requirements: R01-R18.  
Dependencies: P10 and all active launch policy/provider gates resolved.  
Decision gates: Current D01-D17 statuses; superseded proposals do not block launch, but unanswered active monetary rules do.

Previous phase: [P10 - System validation and operational readiness](P10-hardening.md).

Current workflow: one upfront cart payment; admin coordinates/decides within seven days of payment; paid-pending items reserve nothing; admin approval alone reserves. Undecided requests automatically reject at day seven and create refund tasks. Admin performs every refund manually and marks it refunded only after completion; no automatic money movement. Advertiser cancellation within seven days refunds 95% of the cancelled booking amount; Pixlwave retains 5% inclusive of Razorpay processing charges, with no additional processing deduction or fulfillment commission. Later business refunds are limited to owner inability/non-delivery. Owner initial base price and admin-only published-price revisions replace automatic pricing. No pause/change flows or fixed completion countdown. Admin transfers owner funds manually after verification; completed service pays 85% to the owner and Razorpay charges come out of Pixlwave's 15%. Owners specify ad duration, plays per show/day and operating hours for admin approval. Notice is exactly 192 hours from successful payment; review/cancellation closes at 168 hours. Rejection/owner-failure refunds deduct only actual applicable Razorpay processing charges, with no penalty. Admin determines partial-delivery refund amounts manually.

## Entry checklist

- [ ] Repository/local instructions and current accepted decisions read.
- [ ] Prior-phase actual evidence and required inputs verified.
- [ ] Relevant unanswered parameters resolved; accepted policies are not reopened.
- [ ] Provider/configuration prerequisites recorded without secrets.
- [ ] Planned review fixtures, environment and implementation scope agreed.

## Planned deliverables

- [ ] Obtain final approval for admin-only decisions, upfront cart payment, fixed pricing, seven-day cancellation/refund policy, owner non-delivery exception and all category workflows.
- [ ] Configure Indian production servers/data, providers, domain/TLS, safe uploads, backups, alerts and Mappls production access.
- [ ] Publish real verified Kerala listings and admin-approved rates; remove demo content and train admins for the seven-day coordination workload.
- [ ] Complete operational ownership, support, cancellation/refund disclosures, receipt/tax scope and owner onboarding/settlement arrangements.
- [ ] Perform expressly authorized controlled live payment/refund/settlement checks where needed, then deliver release/recovery/training handoffs.

- [ ] Validate the source coverage matrix and manual-operation disclosures, including download receipts, service-window wording and every replaced blueprint workflow.

## Planned testing and validation

- [ ] P11-T01: Production smoke-test public discovery, fixed rates, auth, category cart, payment, paid-review status, admin decisions, refunds and role restrictions.
- [ ] P11-T02: Verify deployed revision/migrations, India data locations, provider keys, map settings, alerts and recoverability.
- [ ] P11-T03: Record approved live transaction reconciliation separately from sandbox evidence; confirm decisions/eligibility match the displayed seven-day policy.
- [ ] P11-T04: Inspect UI/API for obsolete owner approval, post-approval checkout, payment countdown, completion countdown, dynamic pricing and pause/change controls.

- [ ] P11-T05: Walk through every blueprint coverage row with the client; verify delivered replacement behavior, excluded playback/chat/pause flows and downloadable receipts against the released revision.

Manual acceptance scenario: Client signs off on advertiser/admin/owner walkthroughs; named operators accept review, refund, support and payout duties.

Exit gate: Authorized production release is accepted and healthy with current handoffs and all required categories delivered.

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
| P11-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P11-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P11-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P11-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P11-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

After authorized release, transfer ongoing operations to the named support/finance operator with recovery and reconciliation runbooks.

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
