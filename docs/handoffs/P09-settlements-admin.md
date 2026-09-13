# P09 handoff - Owner settlement and admin operations

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Owner settlement and admin operations is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R03, R15.  
Dependencies: P08; provider/account readiness.  
Decision gates: D07 financial allocation; D08 payout eligibility; D13 gateway/manual modes.

Previous phase: [P08 - Campaign changes, evidence, and refunds](P08-campaigns-refunds.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Implement owner earnings and payout status, admin completion review, release action, commission/refund reports, outstanding liabilities, and audit search.
- [ ] Integrate Razorpay Route linked-account onboarding and approved deferred-settlement flow; distinguish transfer creation, release, and actual settlement.
- [ ] Implement controlled manual bank-reference recording only if needed, with evidence and checks that exclude duplicate/in-flight gateway payment.
- [ ] Reconcile payments, transfer holds, reversals, refunds, gateway fees, platform revenue, and owner balances; record exceptions for human resolution.
- [ ] Prevent bank-detail changes, disputes, incomplete evidence, or unresolved money movements from silently bypassing payout checks.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P09-T01: Verify a mixed-owner cart settles each eligible booking independently after completion, without waiting for unrelated owners unless policy requires it.
- [ ] P09-T02: Test duplicate release, timeout/retry, failed/reversed transfer, missing owner onboarding, refund before/after transfer, and webhook replay.
- [ ] P09-T03: Race manual payout recording against automated payout and refund; assert no double payment or release of disputed balances.
- [ ] P09-T04: Reconcile provider test transactions to journal and reports; verify admin permissions and auditable changes.

Manual acceptance scenario: Review owner earnings, release one eligible payout through sandbox-supported flows, block a disputed payout, and rehearse manual fallback if selected.

Exit gate: Every paid/refunded/settled amount reconciles or appears as an explicit tracked exception; payout prerequisites are documented.

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
| P09-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P09-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P09-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P09-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P10: execute system-wide reliability, security, accessibility, and recovery validation.

Next record: [P10 - System validation and operational readiness](P10-hardening.md).

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

