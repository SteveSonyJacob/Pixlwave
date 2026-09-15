# P01 handoff - Foundation and accounts

Plan version: 0.9 draft. Updated: 2026-09-15.  
Status: NOT STARTED  
Implementation revision: NOT AVAILABLE  
Application tests: NOT RUN  
Manual acceptance: NOT REVIEWED

## Authority and dependencies

Read [the plan](../../plan.md), [handoff guide](../../handoff.md), [decision register](../decisions.md), [source review](../requirements-review.md) and [phase/test migration](../phase-mapping.md). Use current plan sections 3-4 for timing, capacity, creative, payment, refund and manual transfer rules. Historical handoffs do not define current phase numbering.

Requirements: R01, R02, R03, R09, R17, R18.  
Entry dependency: Current requirements and source review; scope/design is included in this phase.  
Decision/configuration gates: Accepted business rules and scope; choose auth email method, admin MFA, India environment/configuration plan and initial UI/contracts. Owner verification workflow closes in P02.

This is the first of seven development phases; there is no separate planning phase to implement.

## Entry checklist

- [ ] Read current policies and repository instructions; do not reopen confirmed answers.
- [ ] Verify predecessor revision, tests, manual acceptance and required interfaces.
- [ ] Agree schemas, API/events, permissions and workstream ownership before parallel work.
- [ ] Record provider/environment/configuration prerequisites without secrets.
- [ ] Define fixtures, integration environment and affected earlier regression cases.

## Parallel workstreams and deliverables

### Scope and interface contracts

- [ ] Approve the admin-mediated workflow, permission matrix, charged-cart/item definitions, deadline examples and refund eligibility matrix.
- [ ] Document price ownership: owner supplies the initial base price; only admin changes a published rate after owner discussion. Preserve booked-price history.
- [ ] Review all three category forms, upfront checkout, paid-awaiting-admin status, admin coordination notes, advertiser cancellation, refund tracking and owner fulfillment screens.
- [ ] Specify and validate the confirmed 192-hour notice, 168-hour review/cancellation cutoff, owner non-delivery exception and deadline-to-refund-task contract using dated examples and state/interface definitions. Implementation remains in P04-P06.
- [ ] Review reference-led responsive designs, provider/data plan, media requirements and estimated startup operating costs.

### Platform foundation

- [ ] Scaffold Next.js/TypeScript with reusable UI, clear business modules, configuration validation, supported pinned dependencies and documented local setup.
- [ ] Establish PostgreSQL/Supabase migrations, worker/outbox, durable jobs, structured redacted logs, health checks, fixtures and CI.
- [ ] Separate local/test/staging/production configuration and secret handling; select Indian compute/database/storage/backup/log destinations.
- [ ] Create adapter boundaries for Razorpay, maps, SMTP, SMS and object storage; isolate provider place IDs from first-party listing coordinates.
- [ ] Specify the shared state model and interface boundaries that keep booking, payment, admin decision, refund, fulfillment and settlement separate. Owning phases P04-P06 implement their records and transitions against these contracts.

### Accounts and access foundation

- [ ] Implement Supabase authentication, phone OTP and selected email method, recovery, session expiry, verified identifier linking and business/profile details.
- [ ] Allow one individual account to use advertiser and owner modes; separately grant platform administrator privileges.
- [ ] Explicitly forbid owner accounts from receiving customer request queues or accepting/rejecting bookings. Only admins perform booking decisions and subsequent published-price changes.
- [ ] Protect admin accounts with appropriate MFA and least-privilege access as an engineering requirement.

Parallel sequencing: Scope/design and UI components can progress alongside infrastructure and database setup after the core entities and interfaces are agreed. Auth implementation uses the deployed foundation; identity and permission policies must be agreed before account tests.

## Integration with previous work

No previous implementation is assumed. Integrate the app shell, real database, auth sessions, shared UI, migrations, worker and CI in one runnable environment. Define permission capabilities now; owner verification/listing endpoints are P02 and booking decision endpoints are P04.

The first four validation cases preserve the former scope/design walkthroughs: evidence is reviewed designs, data/state contracts and policy examples, not a running payment feature. All foundation/auth cases require actual runnable code and their stated provider evidence. Owner publication checks occur in P02; direct booking endpoint permission checks occur in P04.

Integration checklist:

- [ ] Use the predecessor's actual records/APIs rather than another demo implementation.
- [ ] Integrate workstreams into one revision/environment with compatible migrations.
- [ ] Rerun affected earlier tests and verify every consumer of a changed interface.
- [ ] Separate fixture/contract evidence from real provider and complete-journey evidence.
- [ ] Resolve integration defects before phase acceptance.

## Planned testing and validation

- [ ] P01-T01: Walk through paid cart submission, manual admin-owner discussion and mixed item decisions without exposing requests to owner accounts.
- [ ] P01-T02: Use dated IST examples to validate minimum notice and seven-day boundaries, including a day-seven rejection and a day-seven cancellation awaiting refund processing.
- [ ] P01-T03: Review owner price submission, admin-only rate editing, current-booking protection, 15% commission and cancellation/refund examples.
- [ ] P01-T04: Trace every requirement to a phase; verify obsolete dynamic pricing, owner approval controls, delayed checkout and pause/change features are absent from current designs.
- [ ] P01-T05: Fresh checkout installs, builds and runs from documented instructions; invalid configuration fails clearly.
- [ ] P01-T06: Migrations apply to an empty database and a representative prior revision; build, lint and type checks pass.
- [ ] P01-T07: Persisted jobs survive worker restart, retries deduplicate side effects and outbox events follow committed transactions.
- [ ] P01-T08: Check browser bundles/logs for secrets and inspect provider region/configuration boundaries.
- [ ] P01-T09: Exercise login, expired/reused OTP, recovery, logout, session expiry and duplicate/linked identities.
- [ ] P01-T10: Validate real auth-delivery setup in allowed test accounts; distinguish provider-blocked checks from mock passes.
- [ ] P01-T11: From a clean environment, apply migrations, sign in, switch advertiser/owner mode, deny admin access to ordinary accounts, persist/retry a harmless outbox event and run CI on the same revision; record real auth-provider evidence.

Manual acceptance scenario: From a fresh checkout, start the app, sign in as separate advertiser/owner/admin accounts, switch modes and inspect access restrictions. Review all category and payment/admin workflow designs.

Exit gate: Foundation and auth work together, scope/interface contracts are documented, phase tests and manual review pass. Future endpoints are not falsely claimed as tested.

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
| P01-T01 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T02 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T03 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T04 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T05 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T06 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T07 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T08 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T09 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T10 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
| P01-T11 | Not available | Define exact reproduction | As specified above | Not executed | None | NOT RUN |
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

Next: [P02 - Inventory management](P02-inventory-management.md).

Required outputs: Runnable repository/environment, migrations, identity/role policies, schema/API/event contracts, UI components, provider configuration references and setup/recovery evidence.

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
| 2026-09-15 | 0.9 | Changed downstream booking/deadline/non-delivery work to specification and validation; implementation remains in P04-P06. |
