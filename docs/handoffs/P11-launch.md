# P11 handoff - Client acceptance and production release

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Client acceptance and production release is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R01-R18.  
Dependencies: P10 passed and all release-blocking decisions resolved.  
Decision gates: D01-D15 closed or explicitly outside enabled launch scope without dropping required end-of-development features.

Previous phase: [P10 - System validation and operational readiness](P10-hardening.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Obtain final acceptance for all three inventory categories, approval/cart behaviour, pricing, cancellation/refund rules, owner settlement, and UI.
- [ ] Configure India-only production infrastructure and verified provider accounts, domain, TLS, private uploads, backups, alert recipients, and operational ownership.
- [ ] Complete production owner onboarding/content, replace demo inventory, and finalize client-approved terms, privacy, support, cancellation, and receipt/tax scope.
- [ ] Perform authorized controlled live payment/refund/settlement verification where provider test mode cannot prove production operation.
- [ ] Publish final setup/release/recovery runbooks, training walkthroughs, credential ownership references, known issues, and monitoring schedule.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P11-T01: Run production smoke tests for public discovery, auth, owner access, uploads, booking eligibility, support, and restricted admin routes.
- [ ] P11-T02: Verify exact deployed revision, configuration, migration state, region evidence, health/alerts, backup availability, and rollback procedure.
- [ ] P11-T03: Record controlled live transaction reconciliation only after explicit authorization for real charges/payouts; never mark sandbox evidence as live evidence.
- [ ] P11-T04: Confirm no demo claims, exposed secrets, test keys, mock payment behaviour, or unresolved launch-blocking policy gates remain.

Manual acceptance scenario: User/client signs off on the release checklist and advertiser/owner/admin walkthroughs; named operator accepts ongoing support and finance responsibility.

Exit gate: Authorized release is healthy and accepted, evidence and final handoff are complete, and all required features are delivered.

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
| P11-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P11-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P11-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P11-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

Operate and monitor; prioritize future enhancements through a separately approved backlog.

After release, record ongoing maintenance separately and retain this file as the accepted release handoff.

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

