# P05 handoff - Requests, reservations, and grouped cart

Updated: 2026-09-14  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Requests, reservations, and grouped cart is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R05-R11.  
Dependencies: P04 and P02; foundational outbox from P01.  
Decision gates: D01-D04 must be settled for complete acceptance.

Previous phase: [P04 - Public discovery and dynamic pricing](P04-discovery-pricing.md). Verify its actual exit evidence before relying on its outputs.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Build category-specific request forms, creative preview, submitted cart, per-item decisions, owner request inbox, and approval/rejection reasons.
- [ ] Enforce minimum booking notice and approved response cutoff on the server using documented IST date semantics.
- [ ] Reserve whole-screen days or the selected theatre/mobile capacity atomically at approval; enforce mobile route compatibility.
- [ ] Implement batch state derivation: early approvals stay reserved, rejected items do not charge, and the 24-hour payment window begins exactly once when all items have a qualifying terminal decision.
- [ ] Implement approved withdrawal/expiry rules, immutable submitted membership if accepted, deadline jobs, and events for notifications. Payment eligibility must not depend on worker punctuality.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P05-T01: Run concurrent owner approvals and prove inventory cannot be oversold for any category, including bookings across multiple dates/shows.
- [ ] P05-T02: Verify day-1/day-5/day-6 approvals produce the expected final 24-hour window; also test reordered/repeated decisions and simultaneous last decisions.
- [ ] P05-T03: Test all rejected, mixed decisions, unanswered owners, withdrawals, expired holds, and changing the earliest date under the accepted policy.
- [ ] P05-T04: Test midnight IST boundaries, eight-day exclusion, stale quote/availability, worker downtime/restart, and attempts to reserve one's own listing if restricted by the accepted policy.

Manual acceptance scenario: Use separate advertiser and owner accounts to reproduce multi-owner approval timing and inspect reserved versus available capacity.

Exit gate: Booking, reservation, and cart lifecycle tests pass against the real database; no unbounded unresolved hold policy remains.

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
| P05-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P05-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P05-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P05-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P06: deliver and track business notifications and support requests for these lifecycle events.

Next record: [P06 - Notifications and support tickets](P06-notifications-support.md).

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

