# P02 inventory operations

Updated: 2026-09-17. These steps extend `P01-foundation.md`; they do not replace its auth, MFA, backup or incident procedures.

## Deploy and recover

1. Add the Mappls/Google and `MEDIA_PRIVATE_BUCKET` variables from `.env.example` to the environment secret store. Keep access tokens server-only.
2. Apply the P02 migrations beginning with `202609170001_inventory_management.sql` using `npm run db:migrate`. They are additive. Take a database backup before production deployment.
3. The first authorized upload creates the configured private Supabase bucket if it does not exist. Operators should preferably pre-create it as private, with a 50 MB object limit, and confirm it is in the Mumbai project.
4. Run `npm run ci` and the destructive `npm run db:test` only against a disposable database whose name contains `pixlwave_test`.
5. Confirm an owner cannot read another account’s asset metadata or base listing row, an anonymous caller can read only `published_inventory`, and an AAL1 admin session cannot execute a review RPC.

Rollback application code before rolling back schema. The additive tables can remain unused safely. Do not drop inventory or private-media tables after owners upload data. If a release must be disabled, remove navigation and deny the mutation RPC grants while preserving the records and storage objects. Restore database and objects as one reconciled set; a database restore alone does not restore deleted Supabase Storage objects.

## Review procedure

For owner verification, open each short-lived document, compare it with the submitted legal/contact data, and approve or reject with a useful reason. Never copy identity-document contents into audit notes. Suspending an approved owner also suspends their published listings.

For listing publication, verify the pin is in Kerala, provider provenance is plausible, audience numbers are clearly owner-attributed, operating hours can contain the promised duration × plays, category capacity is credible, route geometry is a LineString, and the service promise is measurable. Publication creates the initial rate revision and approved service snapshot atomically.

For a later rate change, speak with the owner first. Record a non-sensitive discussion summary and reason, then publish the new amount. Never overwrite or delete earlier revisions. Existing paid snapshots, once implemented, keep their original revision.

## Media response

Uploads failing signature or the test malware check never enter storage. If metadata insertion fails after object upload, the route removes that exact just-created object. Clean metadata is necessary but not sufficient for video checkout until the production malware/media-probe worker is deployed.

On suspected malicious content, suspend affected access, preserve metadata/audit evidence, quarantine the exact object through the storage console and record an incident outside raw application logs. Do not log signed URLs, access tokens, document contents or creative bytes. Signed links expire after 300 seconds.

Provider/manual acceptance still required: real Mappls Kerala searches and fallback behavior, storage region/bucket inspection, production malware scanning, video metadata extraction, retention approval and phone/desktop review by owner/admin/advertiser roles.
