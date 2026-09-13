# P07 handoff - Grouped checkout and financial ledger

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Grouped checkout and financial ledger is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R08, R11, R12, R15.  
Dependencies: P05, P06; accepted pricing/financial contracts.  
Decision gates: D07 fee/commission basis; D13 Razorpay account capability; D15 receipt/tax scope; D01-D02 deadline semantics.

Previous phase: [P06 - Notifications and support tickets](P06-notifications-support.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Create one server-priced Razorpay order for the accepted cart subtotal and expose supported UPI/card/net-banking checkout methods.
- [ ] Freeze item allocations and 25% commission snapshots according to the accepted policy; represent all money in integer paise.
- [ ] Implement verified webhooks, idempotent processing, an append-only financial journal, payment attempts, receipts, payment status, and provider reconciliation.
- [ ] Treat browser success as provisional until verified; handle duplicate/late payments, abandoned checkout, expiry races, and paid-but-unreconciled states without double booking.
- [ ] Add a separate tax calculation interface and future tax breakdown area; no invented GST calculation or GST invoice claim.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P07-T01: Run mixed-owner/mixed-category cart payments and verify accepted items only, exact allocation totals, rounding, and one payment confirming all included bookings atomically.
- [ ] P07-T02: Test tampered totals, forged/replayed/out-of-order webhooks, multiple clicks, multiple successful attempts, and lost callback/webhook delivery.
- [ ] P07-T03: Test payment arriving exactly at/after the deadline, worker failure, provider timeout, and held inventory being unavailable; reconcile or refund safely under an explicit exception policy.
- [ ] P07-T04: Verify receipt ownership, audit journal consistency, settlement ineligibility before completion, and notifications after confirmed payment.

Manual acceptance scenario: Complete sandbox checkout for a cart with accepted and rejected items, inspect customer receipt and admin allocation ledger, then reproduce failed payment.

Exit gate: Sandbox payment and reconciliation evidence passes; no live checkout until P11 authorization and provider readiness.

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

| Check | Tested revision / environment | Command or steps | Expected result | Actual result | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| P07-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P07-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P07-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P07-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| Manual review | Not available | Run the acceptance scenario above | User/client accepts delivered behaviour | Not reviewed | None | NOT REVIEWED |

For each executed check record date/time, precise command or manual steps, data fixtures, browser/device when applicable, and links to relevant reports/screenshots/traces. Capture failures as well as passes.

## Manual sign-off

- Reviewer: NOT ASSIGNED.
- Date: NOT REVIEWED.
- Revision/environment reviewed: NOT AVAILABLE.
- Feedback: NOT RECORDED.
- Decision: NOT APPROVED.
- Follow-up actions: NOT RECORDED.

## Known issues, dependencies, and scope changes

| Item | Impact | Owner | Required resolution | State |
| --- | --- | --- | --- | --- |
| Open policy/provider gates | See decision gates above | User/client for policies; developer for technical verification | Record accepted answers and validate implementation | OPEN |
| Implementation absent | No phase behaviour is available | Future phase developer | Complete planned deliverables | NOT STARTED |

Add actual defects with severity, reproduction, affected requirements, workaround if any, and whether the next phase is blocked. A temporary mock or disabled capability is a limitation, not a completed integration. Do not remove an unresolved policy merely to close this phase.

## Operational handoff

Record the following when applicable:
- Alerts and operational dashboards introduced.
- Scheduled jobs, deadlines, idempotency keys, and retry/reconciliation responsibilities.
- Audit events and retention/cleanup configuration.
- Backup or migration recovery evidence.
- Provider failure modes and support/escalation path.
- Cost/capacity changes from this phase.
- Outstanding financial or reservation exceptions requiring reconciliation.

Current state: NOT IMPLEMENTED.

## Next-phase instructions

P08: operate paid campaigns, collect evidence, and handle approved changes/refunds.

Next record: [P08 - Campaign changes, evidence, and refunds](P08-campaigns-refunds.md).

Before transferring work:
- [ ] This file reflects actual code and deployed revision.
- [ ] Required tests pass with evidence; blocked checks are not labelled passed.
- [ ] Manual validation is recorded.
- [ ] Relevant decisions are accepted and reflected in the master plan.
- [ ] Known issues and operational recovery instructions are documented.
- [ ] The next phase has the schema/contracts/configuration and fixtures it needs.

Next concrete action at draft creation: resolve the relevant decision gates and verify dependencies; this phase is not authorized as completed by the existence of this file.

## Change history

| Date | Change | Author/source |
| --- | --- | --- |
| 2026-09-14 | Created phase-specific planning handoff with unexecuted validation checks. | User request to draft now and update after later answers. |

