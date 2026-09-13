# P03 handoff - Inventory, moderation, and media

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Inventory, moderation, and media is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R03-R07, R10, R18.  
Dependencies: P02.  
Decision gates: D03 mobile route policy; D14 inventory/media limits; D10 storage residency.

Previous phase: [P02 - Authentication and account roles](P02-auth-roles.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Build owner CRUD and admin publish/reject/suspend workflows for LED screens, theatre auditoriums/shows/ad slots, and mobile vehicles/routes/rotating slots.
- [ ] Store map coordinates, address/locality, imagery, dimensions/resolution, base price inputs, operating hours, capacity, ad duration/frequency, and owner-declared audience estimates with attribution.
- [ ] Support calendars, maintenance/blackout dates, recurring shows with exceptions, and multiple vehicle inventory. Preserve previously agreed bookings when editing listings.
- [ ] Implement private ad/evidence upload primitives and public listing image handling, file validation, scanning/quarantine, safe previews, authorized downloads, and retention controls.
- [ ] Create clearly marked non-production fixtures for all categories and owner verification scenarios.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P03-T01: Check listing approval and suspension permissions, cross-owner edits, and exposure of draft/unverified listings.
- [ ] P03-T02: Verify theatre show capacity and mobile slot/route representation; test recurring-calendar exceptions and overlapping blackout dates.
- [ ] P03-T03: Reject spoofed file types, oversized/unsupported/corrupt files, and unauthorized downloads; verify expiring links and quarantine.
- [ ] P03-T04: Ensure capacity reduction, vehicle reassignment, or listing deletion cannot silently invalidate existing commitments.

Manual acceptance scenario: Create, review, publish, edit, and suspend one listing of each category; review image/video previews and location coordinates.

Exit gate: All three inventory types are accurately representable and access-controlled; unresolved resource semantics block the affected module.

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
| P03-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P03-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P03-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P03-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P04: connect approved inventory to public search and versioned quotes.

Next record: [P04 - Public discovery and dynamic pricing](P04-discovery-pricing.md).

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

