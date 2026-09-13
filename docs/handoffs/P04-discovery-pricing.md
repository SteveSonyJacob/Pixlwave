# P04 handoff - Public discovery and dynamic pricing

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Public discovery and dynamic pricing is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R04, R08, R18.  
Dependencies: P03.  
Decision gates: D04 pricing contract; D11 geography; D01 date filter semantics.

Previous phase: [P03 - Inventory, moderation, and media](P03-inventory-media.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Build homepage, category/city/locality/date/budget search, featured inventory, detail pages, map/list views, and accessible responsive navigation.
- [ ] Implement owner base prices and a versioned deterministic demand-pricing service with approved demand signals, locality scope, limits, and cold-start fallback.
- [ ] Generate reproducible dated line-item quotes showing billing unit, price breakdown, total, and validity. Persist quote inputs/version for later reconciliation.
- [ ] Prevent rejected/draft listings from discovery, misleading availability claims, manipulation through repeated requests, and repricing of protected contract snapshots.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P04-T01: Check search/filter combinations, pagination, map/list agreement, out-of-service inventory, and no-results/loading/provider-failure states.
- [ ] P04-T02: Use deterministic pricing fixtures for low/high demand, nearby categories, sparse data, duplicate demand, bounds, and rounding.
- [ ] P04-T03: Verify same-day/date-range totals and show/slot/day units; ensure changing current rates cannot modify a saved quote protected by policy.
- [ ] P04-T04: Review keyboard use, screen-reader labels, mobile layouts, and meaningful rendering of public listing pages.

Manual acceptance scenario: Review discovery on phone and desktop against the references; review worked pricing examples with the client.

Exit gate: Discovery is reviewable with sample data; formula and price-lock policy are accepted and demonstrated.

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
| P04-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P04-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P04-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P04-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P05: submit quoted bookings and reserve capacity under concurrent approvals.

Next record: [P05 - Requests, reservations, and grouped cart](P05-booking-cart.md).

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

