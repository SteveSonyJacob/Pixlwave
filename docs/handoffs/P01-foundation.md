# P01 handoff - Engineering foundation

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Engineering foundation is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R01, R17.  
Dependencies: P00 architecture direction; unresolved unrelated business values may remain gated.  
Decision gates: D10 for final providers; D12 for final sizes. Provider-neutral local scaffolding can proceed.

Previous phase: [P00 - Scope, policies, and design](P00-scope-design.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Create a TypeScript/Next.js project with reusable UI foundations, separate business modules, validated configuration, reproducible dependency versions, and documented local setup.
- [ ] Create migration-managed PostgreSQL/Supabase setup, storage adapter, worker/outbox skeleton, test fixtures, health checks, structured redacted logging, and CI.
- [ ] Separate local, test, staging, and production settings. Define secret handling and India-region deployment configuration; do not deploy abroad for previews.
- [ ] Establish schema boundaries for users, listings, resource capacity, quote versions, bookings, carts, ledger, tickets, and audit events.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P01-T01: Fresh checkout can install, configure, build, and run the application and worker with documented steps.
- [ ] P01-T02: CI runs lint, type checks, focused tests, and production build; invalid configuration fails clearly.
- [ ] P01-T03: Migrations apply to an empty test database; worker jobs survive restart and do not create duplicate side effects.
- [ ] P01-T04: Verify secrets are not included in browser bundles or logs; inspect region configuration and storage/log destinations.

Manual acceptance scenario: Run the local setup from the written guide and review a staging shell and test-account fixtures.

Exit gate: Reproducible foundation and CI pass; architecture/setup handoff is sufficient for another developer.

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
| P01-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P01-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P01-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P01-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P02: implement authenticated sessions and enforced permissions.

Next record: [P02 - Authentication and account roles](P02-auth-roles.md).

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

