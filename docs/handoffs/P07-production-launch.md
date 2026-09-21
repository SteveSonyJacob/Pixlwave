# P07 handoff - Production validation and launch

Plan version: 0.9 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18.  
Entry dependency: P06 accepted and its actual handoff verified.  
Decision/configuration gates: P01-P06 feature gates accepted; provider activation, real inventory, operating budget/targets and launch authorization ready. First close hardening and client acceptance; only then perform authorized production release.

Previous phase: [P06 - Fulfillment and settlement](P06-fulfillment-settlement.md).

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### System hardening and operational readiness

- [ ] Run integrated advertiser/admin/owner regression on supported phone/tablet/desktop browsers.
- [ ] Validate access controls, uploads, webhook security, map quotas, accessibility, load and multi-user concurrency.
- [ ] Monitor paid-pending requests, approved capacity, seven-day workload, automatic rejection jobs and manual refund queues, cancellation/refund liabilities, worker lag and failed payouts.
- [ ] Exercise Indian-region backup/restore, migrations, deployment recovery, worker/provider outages and reconciliation of money movements since backup.
- [ ] Produce measured capacity/cost results and operator runbooks for manual coordination, missed deadlines, non-delivery/refund and settlement exceptions.
- [ ] Restore manual refund and bank-transfer journals as well as payment events; reconcile external transactions performed after the backup before operators act on restored pending tasks.

### Client acceptance and production release

- [ ] Obtain final approval for admin-only decisions, upfront cart payment, fixed pricing, seven-day cancellation/refund policy, owner non-delivery exception and all category workflows.
- [ ] Configure Indian production servers/data, providers, domain/TLS, safe uploads, backups, alerts and production-capable OpenStreetMap-derived tile/geocoding access.
- [ ] Publish real verified Kerala listings and admin-approved rates; remove demo content and train admins for the seven-day coordination workload.
- [ ] Complete operational ownership, support, cancellation/refund disclosures, receipt/tax scope and owner onboarding/settlement arrangements.
- [ ] Perform expressly authorized controlled live payment/refund/settlement checks where needed, then deliver release/recovery/training handoffs.
- [ ] Validate the source coverage matrix and manual-operation disclosures, including download receipts, service-window wording and every replaced blueprint workflow.

Parallel sequencing: Security, accessibility, load testing and operator documentation may run in parallel against one release candidate. Fixes require affected regression. Hardening, client acceptance and production release are sequential gates within this phase.

## Integration with previous work

Validate the complete application, not isolated demos. Recover database, media and manual money records in India; reconcile external transactions before restored tasks are acted on. Production release uses the exact tested revision/configuration with approved changes only.

Hardening and client acceptance must pass before specifically authorized release/live checks. Record the gates separately even though they share one phase.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P07-T01: Run production-like upfront-payment/admin-decision journeys across all categories, including mixed refunds and concurrent last-slot attempts.
- [ ] P07-T02: Verify owners cannot receive/decide requests or edit published rates; test private notes, files, sessions, signed webhooks and safe logs.
- [ ] P07-T03: Simulate outage at the seven-day deadline: block late acceptance, recover automatic rejection and manual refund task creation promptly and exactly once without calling refund or payout APIs, preserve timely cancellation records and retain unresolved obligations.
- [ ] P07-T04: Restore into an isolated Indian environment, reconcile newer provider events, and measure agreed load/accessibility targets.
- [ ] P07-T05: Restore a backup predating a manually completed refund/owner transfer, then reconcile external evidence; ensure stale pending tasks warn operators and cannot become duplicate normal completion records.
- [ ] P07-T06: Production smoke-test public discovery, fixed rates, auth, category cart, payment, paid-review status, admin decisions, refunds and role restrictions.
- [ ] P07-T07: Verify deployed revision/migrations, India data locations, provider keys, map settings, alerts and recoverability.
- [ ] P07-T08: Record approved live transaction reconciliation separately from sandbox evidence; confirm decisions/eligibility match the displayed seven-day policy.
- [ ] P07-T09: Inspect UI/API for obsolete owner approval, post-approval checkout, payment countdown, completion countdown, dynamic pricing and pause/change controls.
- [ ] P07-T10: Walk through every blueprint coverage row with the client; verify delivered replacement behavior, excluded playback/chat/pause flows and downloadable receipts against the released revision.
- [ ] P07-T11: Promote the same accepted P01-P06 release candidate through full regression, client acceptance and authorized deployment; verify migration/configuration parity, restore/reconciliation rehearsal and post-release smoke checks without losing manual finance or booking history.

Manual acceptance scenario: Client walks through advertiser/owner/admin flows on supported devices, signs off the release candidate and rehearses refund/payout/incident recovery. Named operators accept responsibilities; then approve and verify release.

Exit gate: All features and validation cases pass, critical/high defects are resolved, client acceptance is recorded and specifically authorized production release is healthy. No phase count reduction waives these gates.

## Actual implementation record

- Delivered behavior and omitted scope: NOT IMPLEMENTED.
- Files/modules changed: NONE.
- Branch/commit/build revision and environment URL: NOT AVAILABLE.
- Accepted decisions, architecture and workstream ownership: NOT RECORDED.
- Schemas/migrations, compatibility and recovery commands: NOT CREATED.
- API/event contracts, example payloads and permissions: NOT IMPLEMENTED.
- Configuration names and secret-store references: NOT CONFIGURED.
- Provider account/region verification: NOT VERIFIED.
- Setup/run commands and pinned versions: NOT ESTABLISHED.
- Predecessor integration and regression evidence: NOT RECORDED.
- Operations/recovery/reconciliation instructions: NOT ESTABLISHED.

Do not paste access tokens, OTPs, personal data or bank credentials into this record.

## Validation evidence

These checks are planned, not executed.

| Check | Revision/environment | Command or manual procedure | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| P07-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T08 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T09 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T10 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P07-T11 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| Earlier-phase regression | Not available | List affected case IDs and rerun steps | Previous behavior remains correct | Not executed | None | NOT RUN |
| Manual review | Not available | Follow acceptance scenario | Client accepts integrated behavior | Not reviewed | None | NOT REVIEWED |

Record date/time, role, fixture, browser/device, provider mode and report/trace/screenshot path. FAIL, BLOCKED, NOT RUN and PASS are distinct. Never use planned output as evidence.

## Manual sign-off and defects

- Reviewer/date/revision: NOT ASSIGNED / NOT REVIEWED.
- Integration and regression accepted: NOT REVIEWED.
- Decision: NOT APPROVED.
- Feedback and required follow-up: NOT RECORDED.

| Item | Impact | Owner | Required action | Status |
| --- | --- | --- | --- | --- |
| No implementation | Phase functionality not delivered | Future developer | Build and validate all workstreams | NOT STARTED |
| Configuration/provider checks | See entry gates | Assigned implementer/operator | Record real setup and verification | NOT VERIFIED |
| Integration evidence | Previous/current behavior not demonstrated | Phase implementer | Execute current tests and affected regression | NOT RUN |

Add actual defects with severity, reproduction, affected requirements, owner, mitigation and next-phase impact. Retain operational instructions for deadline jobs, notifications, manual refunds/transfers, reconciliation and restore where applicable.

## Next-phase handoff

Next: ongoing production operation under the accepted runbooks; no additional development phase is implied.

Required outputs: Accepted release revision, test and manual-review evidence, deployed configuration/migrations, restore/reconciliation runbooks, operator ownership, training and known-issue register.

Before handoff:

- [ ] Document delivered scope and exact revision.
- [ ] Pass current cases, added integration case and affected earlier regression.
- [ ] Record real manual/client acceptance and unresolved defects.
- [ ] Update schemas/contracts, decision register, setup and recovery instructions.
- [ ] Provide concrete next actions and verify the next phase can use these artifacts.

## Change history

| Date | Revision | Change |
| --- | --- | --- |
| 2026-09-15 | 0.8 | Created this current phase through seven-phase consolidation. Previous tests mapped without loss; one integration case added. No implementation or tests executed. |
| 2026-09-15 | 0.9 | Inherited corrected upstream ownership and rerun boundaries; production gates unchanged. |
