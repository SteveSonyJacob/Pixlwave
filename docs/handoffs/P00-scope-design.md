# P00 handoff - Scope, policies, and design

Updated: 2026-09-14  
Status: DRAFT / AWAITING DECISIONS  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Purpose and context

Scope, policies, and design is one development phase in [the master plan](../../plan.md). Read [the handoff guide](../../handoff.md) and [the decision register](../decisions.md) before beginning.

Requirements: R01, R09, R18.  
Dependencies: None; this draft is the starting input.  
Decision gates: D01-D15: resolve structural rules now; explicitly schedule remaining parameter/provider decisions before affected phase acceptance.

Starting phase: the PDF, UI references, user clarifications, and planning draft are inputs. No implementation exists.

## Inputs to verify

- [ ] Current repository state and applicable local instructions inspected.
- [ ] Confirmed requirements and pending decision IDs read.
- [ ] Prior phase dependencies and required test evidence verified.
- [ ] Relevant client answers recorded; proposals not mistaken for accepted policies.
- [ ] Needed configuration/provider access is available, with secret values kept outside documentation.
- [ ] Implemented scope and planned review are agreed for this phase.

## Planned deliverables

- [ ] Approve the requirements traceability, glossary, role/permission matrix, and the distinction between campaign, booking, submitted cart, payment, and settlement.
- [ ] Specify LED day exclusivity, theatre show/slot capacity, and mobile vehicle/slot/route behaviour. Define quote and reservation contracts.
- [ ] Resolve timing and batch-payment examples, refund/fine policy, completion evidence, and payout authority using the decision register.
- [ ] Create responsive designs for public discovery, all three booking forms, cart decision tracking, advertiser/owner/admin dashboards, tickets, and error/empty states. Use the supplied references and replaceable branding.
- [ ] Document media limits, required owner verification details, service providers, preliminary India-only deployment diagram, and proposed performance/cost targets.

## Planned tests and validation

These checks are specifications, not results. Fill the evidence table below after execution.

- [ ] P00-T01: Walk through one LED booking, two advertisers sharing theatre slots, and mobile slots sharing a route; identify every resource reserved.
- [ ] P00-T02: Tabletop the user's day-1/day-5/day-6 cart example and payment deadline on day 7; include one rejection, no response, withdrawal, and all-rejected cases.
- [ ] P00-T03: Test policy examples for earliest booking date in IST, approval near campaign start, partial delivery, pause fine, refund rounding, and mixed-owner settlement.
- [ ] P00-T04: Review every supplied PDF requirement against the requirement map; review mobile/desktop designs and remove unsupported instant-booking or trust claims.

Manual acceptance scenario: User/client reviews workflows, visual direction, decision outcomes, and scope. Record accepted recommendations explicitly.

Exit gate: Scope and designs approved; no unresolved structural contradiction is passed to booking, pricing, or money implementation. Deferred values have named gates.

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
| P00-T01 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P00-T02 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P00-T03 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
| P00-T04 | Not available | Define exact reproduction from planned check | As specified above | Not executed | None | NOT RUN |
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

P01: establish the repository, local setup, schema boundaries, and CI using the accepted architecture.

Next record: [P01 - Engineering foundation](P01-foundation.md).

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

