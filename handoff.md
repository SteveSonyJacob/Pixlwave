# Pixlwave development handoff guide

Updated: 2026-09-14. Status: planning draft; development has not started.

## Start here

1. Read [plan.md](plan.md), then [docs/decisions.md](docs/decisions.md).
2. Read the previous completed phase handoff and the target phase handoff below.
3. Inspect the actual repository and applicable `AGENTS.md` instructions. Document any mismatch between code and handoff.
4. Check the phase dependencies, unresolved decision gates, and actual validation evidence. A document existing is not a phase passing.
5. Implement only the authorized phase scope. Confirmed user answers outrank blueprint and visual references. Proposed defaults remain proposals.

## Current repository state

- Planning documents and source references are present.
- No application scaffold, database schema, deployed environments, provider credentials, or verified production integrations exist.
- No application tests have been run. All phase implementation and test statuses start as NOT STARTED / NOT RUN.
- Only planning-document consistency is reviewed in this task; that does not count as P00 client acceptance.
- Pending questions are centrally tracked in `docs/decisions.md`. Update that register, the plan, and impacted handoffs when answers arrive.

## Phase index

| Phase | Handoff | Initial status |
| --- | --- | --- |
| P00 | [Scope, policies, and design](docs/handoffs/P00-scope-design.md) | DRAFT / AWAITING DECISIONS |
| P01 | [Engineering foundation](docs/handoffs/P01-foundation.md) | NOT STARTED |
| P02 | [Authentication and roles](docs/handoffs/P02-auth-roles.md) | NOT STARTED |
| P03 | [Inventory, moderation, and media](docs/handoffs/P03-inventory-media.md) | NOT STARTED |
| P04 | [Discovery and dynamic pricing](docs/handoffs/P04-discovery-pricing.md) | NOT STARTED |
| P05 | [Requests, reservations, and grouped cart](docs/handoffs/P05-booking-cart.md) | NOT STARTED |
| P06 | [Notifications and support](docs/handoffs/P06-notifications-support.md) | NOT STARTED |
| P07 | [Checkout and financial ledger](docs/handoffs/P07-payments-ledger.md) | NOT STARTED |
| P08 | [Campaign changes, evidence, and refunds](docs/handoffs/P08-campaigns-refunds.md) | NOT STARTED |
| P09 | [Owner settlement and admin operations](docs/handoffs/P09-settlements-admin.md) | NOT STARTED |
| P10 | [System validation and operational readiness](docs/handoffs/P10-hardening.md) | NOT STARTED |
| P11 | [Client acceptance and production release](docs/handoffs/P11-launch.md) | NOT STARTED |

## Required handoff contents at every phase boundary

Complete the existing phase file with actual results. Never turn a planned test into a claimed pass.

- Scope delivered and acceptance criteria met; deferred items and why.
- Commit/revision, branch if used, environment, deployment URL, and implementation paths.
- Current architecture and important decisions, including decision IDs and user confirmation dates.
- Schema/migration names, exact application procedure, compatibility effects, and recovery steps.
- API/event contracts, permissions, invariants, and representative payloads without secrets or personal data.
- Setup commands, version requirements, configuration variable names, secret-store locations/references, and provider prerequisites. Never include secret values.
- Test commands actually run, timestamp, tested revision/environment, observed result, and report/screenshot/trace links.
- Manual review steps and findings, reviewer, review date, approval or requested changes.
- Known defects with severity, affected workflows, reproducibility, owner, and whether they block the next phase.
- Operational notes, dashboards/alerts added, retries/reconciliation, rollback or forward-recovery procedure, and remaining risks.
- Next phase entry checklist, first concrete task, dependencies, and unresolved questions that must not be guessed.

## Validation record template

| Check ID | Requirement | Command or manual steps | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Fill during development | Rxx / Dxx | Exact reproducible procedure | Specific outcome | Actual outcome | Artifact path/link | NOT RUN / PASS / FAIL / BLOCKED |

Manual review must identify the test account role, data fixture, browser/device, and expected state change. Keep credentials in the approved secret store, not in this file.

## Phase transition rules

- Normal sequence is P00 through P11. Later work can start only when its stated inputs exist and relevant decisions are settled. Independent scaffolding may proceed while unrelated client decisions remain open, but partial work is not a completed phase.
- A phase is complete only when its required tests pass, blockers are resolved, handoff is current, and the user/client manual validation is recorded.
- A test skipped for missing credentials remains blocked, with the credential/provider dependency and next action recorded. A mock test does not prove live integration.
- If a business policy remains unresolved, implement only policy-neutral infrastructure and keep the affected user action unavailable. Do not implement an arbitrary fine, payout, quote repricing, or expiry policy.
- Each change to payments, reservation deadlines, or refunds requires regression checks for existing contracts and financial reconciliation.
- Do not enable real-money checkout or payouts until the release gate is met.

## Recovery and continuity

On resuming in a new development session, verify repository state and read the most recent handoff evidence before continuing. If work was interrupted mid-migration, webhook processing, refund, or payout, reconcile persisted and provider states before retrying. If a decision changes, record its effect on existing records before editing code.

## Next action

Collect answers to D01-D15, prioritizing timing/cart behaviour, shared mobile routes, pricing, refund/fine rules, and India-only provider scope. Update P00 with an accepted workflow and approved designs. No deployment or application development has been performed by creating these documents.
