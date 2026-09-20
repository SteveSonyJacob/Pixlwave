# P03 discovery and communication operations

Updated: 2026-09-19. This phase is in progress; do not use this document as acceptance evidence.

## Apply and verify

1. Create or select a disposable PostgreSQL database whose name contains `pixlwave_test`.
2. Set `DATABASE_URL` to that database and run `npm run db:test`. The runner intentionally refuses any database whose name does not contain `pixlwave_test`.
3. Apply migrations to the target non-production environment with `npm run db:migrate` only after the disposable replay passes.
4. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:docs`, `npm run build` and `npm run check:client-secrets`.
5. Publish a P02 listing with a future calendar and verify `/discover`, `/media/:id`, a rate-change-invalidated quote, requester/admin ticket views and internal-note isolation.

The Phase 3 migrations are ordered deliberately. `202609190001` commits the `listing_media` enum value and `202609190004` commits the `support_attachment` enum value before later migrations use them. Do not combine either enum addition into the next migration because PostgreSQL cannot safely use a newly added enum value in the same migration transaction.

## Recovery

Migrations are forward-only. If deployment fails before traffic uses the new tables, fix the SQL and replay a fresh disposable database before applying a corrective migration. Do not drop quote or ticket records after use: they are audit-relevant history. A listing image remains in the private bucket even when public metadata is unavailable; public routes fail closed.

If discovery cannot reach Supabase, it displays an unavailable state and never fabricates inventory. If a quote expires or a rate changes, create a fresh quote. Support ticket delivery records are independent from ticket status.

## Open provider work

- Implement Mappls public map markers, clustering and mobile route geometry, then validate representative Kerala locations, quotas and restricted keys.
- Resend is selected for application email. Configure `APP_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM` and `RESEND_WEBHOOK_SECRET` only in the worker/application secret store. Register `https://<app-host>/api/webhooks/resend` for sent, delivered, delivery-delayed, bounced, complained, failed and suppressed events. The endpoint verifies the raw-body Svix signature before recording state. Run the durable worker with `npm run worker` and verify an ordinary Gmail delivery plus a controlled bounce. Supabase Auth SMTP alone does not dispatch application notifications.
- Enable SMS only after the client chooses a TRAI DLT-compliant India OTP/notification path. Otherwise keep SMS suppressed and use in-app/email.
- Ticket attachments accept PDF/PNG/JPEG only, up to 10 MB, and require a clean signature/scan result before download. The application records a retention deadline of 180 days when an administrator closes the ticket. Add a scheduled cleanup worker that removes the corresponding private storage objects once `retention_until` has passed, and record its deletion evidence.

Never place SMTP passwords, Resend keys/webhook secrets, Mappls tokens, recipient addresses or ticket bodies in logs or documentation.
