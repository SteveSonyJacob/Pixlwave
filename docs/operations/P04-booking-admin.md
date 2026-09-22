# P04 booking and admin operations

Updated: 2026-09-22. Implementation is present; disposable-database replay and manual acceptance remain required.

## Apply and verify

1. Create an isolated PostgreSQL database whose name contains `pixlwave_test`, point `DATABASE_URL` at it, and run `npm run db:test`. The command destroys and recreates schemas in that database and therefore refuses every other database name.
2. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:docs`, `npm run build` and `npm run check:client-secrets`.
3. Apply migrations to a non-production integration environment only after the disposable replay succeeds.
4. Run `npm run worker` continuously. It checks review reminders and overdue paid-pending lines once per minute. Database locks and idempotent notification keys make retries safe.
5. For fixture acceptance, create and submit a cart in the browser. In an isolated test database only, set `P04_FIXTURE_FUNDING_ENABLED=true` in the command environment and run `npm run fixture:fund-cart -- <cart-uuid> [captured-at-iso]`. Keep the variable false or absent everywhere else.
6. Review the funded lines at `/admin/bookings` with an AAL2 administrator. Record private coordination notes and approve/reject items independently. Confirm owner accounts have no incoming request view.

## Invariants and monitoring

- Submitted cart membership, quote terms, explicit units, service terms and creative metadata are immutable. New additions use a new open cart.
- Trusted capture requires every actual service start to be at least 192 hours after capture. The decision/cancellation deadline is exactly capture plus 168 hours.
- A capture after checkout expiry or too late for service notice is still recorded as customer money. Ineligible lines become `payment_ineligible` with full manual refund obligations; they never enter the approvable queue.
- Paid-pending lines have no `booking_allocations`. Approval locks every requested unit and atomically inserts the whole line or nothing.
- LED dates allow one active allocation. Theatre shows and mobile dates enforce snapshotted capacities. Every dated allocation keeps its original unit value. A custom mobile route requires no existing approved allocation on the date; later shared bookings must use the committed route.
- Approval at or after the recorded deadline becomes deadline rejection even when the worker is late. Expiry and advertiser cancellation create `refund_obligations` only; neither calls a gateway.
- Watch worker lag, `paid_pending` lines past `decision_due_at`, pending manual refund obligations, failed notification outbox events and active allocations without approved lines.

## Recovery and reconciliation

Migrations are forward-only. Never delete submitted carts, lines, events or refund obligations after fixture or real funding. After worker downtime, restart it: overdue lines are claimed with row locks and processed exactly once. If a backup is restored, reconcile payment references and external manual refund evidence before acting on pending work; a pending obligation is not authorization to repeat an uncertain external refund.

Phase 5 must replace the fixture adapter with verified Razorpay sandbox capture, record actual processing charges, and rerun the complete booking/capacity/refund flow. The `p04_fixture` adapter must never be enabled in production.
