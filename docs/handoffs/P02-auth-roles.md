# P02 handoff - Authentication and account roles

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Authentication and account roles is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R02, R03.  
Dependencies: P01.  
Decision gates: D09 authentication modes/providers; D10 provider scope; D14 owner verification fields.

Previous phase: [P01 - Engineering foundation](P01-foundation.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Integrate Supabase Auth for confirmed email login mode and phone OTP, logout, session expiry, profile management, account recovery, and business details.
- [ ] Allow one account to switch advertiser/owner modes; no team-member feature. Link identifiers only through verified account-linking flows.
- [ ] Implement owner verification submission/review and server-enforced advertiser, owner, and administrator access. Add database access policies and audited privileged actions.
- [ ] Protect administrator access with a proposed MFA requirement recorded in the security design; implement rate limiting and abuse controls.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P02-T01: Verify login, recovery, invalid/expired/reused OTP, session expiry, logout, and identifier-linking behaviour.
- [ ] P02-T02: Attempt cross-account profile/booking reads, role escalation, direct API access, and database access outside policies.
- [ ] P02-T03: Confirm unverified owners cannot publish inventory and UI role switching does not grant unauthorized privileges.
- [ ] P02-T04: Exercise authentication messages using real provider test configuration; mocks alone do not close provider acceptance.

Manual acceptance scenario: Review advertiser/owner switching, owner verification, recovery, and admin access using separate accounts.

Exit gate: Authentication and permissions work across server and database boundaries; delivery-provider dependencies are resolved or explicitly block acceptance.

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
| P02-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P02-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P02-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P02-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P03: owner inventory creation, moderation, and media handling.

Next record: [P03 - Inventory, moderation, and media](P03-inventory-media.md).

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

