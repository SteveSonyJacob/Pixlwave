# P08 handoff - Campaign changes, evidence, and refunds

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Campaign changes, evidence, and refunds is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R13, R14, R16.  
Dependencies: P07.  
Decision gates: D05 pause/fine policy; D06 cancellation/refund units; D08 completion/dispute rules; D14 evidence requirements.

Previous phase: [P07 - Grouped checkout and financial ledger](P07-payments-ledger.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Build campaign dashboards with truthful scheduled/owner-reported live/completed status; no assertion of verified physical playback from a calendar alone.
- [ ] Implement approval-based extensions, creative replacements, pauses/resumption, and paid cancellations with approved capacity and price effects.
- [ ] Collect owner photo/video evidence and advertiser disputes; give admin controlled completion/fraud/non-delivery decisions with reasons and audit history.
- [ ] Implement full/partial refunds for undelivered units, approved fines and commission adjustments, 1-2-day admin review tracking, and separate gateway processing status.
- [ ] Add compensating journal entries, item-level refund allocations, safe refund retries, and payout blocking while disputes/refunds are unresolved.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P08-T01: Test competing extension requests, rejected changes preserving original contracts, and payment-required extensions not becoming active prematurely.
- [ ] P08-T02: Test partial delivery across dynamic-price days/shows, multiple cart owners, penalty caps, integer rounding, cumulative refund limits, and refunded commission treatment.
- [ ] P08-T03: Test duplicate admin actions, failed/pending refund responses, reversal prerequisites, and concurrent refund versus settlement attempts.
- [ ] P08-T04: Verify evidence authorization, fake/missing evidence review, advertiser disputes, and inability of owners to approve their own payout.

Manual acceptance scenario: Run completion with evidence, owner non-delivery, partial refund, advertiser cancellation, and accepted/rejected pause/extension scenarios.

Exit gate: All agreed campaign policies and refund accounting pass; review time is not displayed as guaranteed bank-credit time.

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
| P08-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P08-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P08-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P08-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P09: release only reconciled eligible balances and complete the admin finance workspace.

Next record: [P09 - Owner settlement and admin operations](P09-settlements-admin.md).

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

