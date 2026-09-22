import { Pool } from "pg";
import { migrate, migrationFiles } from "../src/lib/database/migrations";
import { loadLocalEnvFile } from "../src/lib/config/load-local-env";

async function resetWithAuthStubs(pool: Pool) {
  await pool.query("drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists extensions cascade; create schema public; create schema auth; create schema extensions");
  await pool.query(`
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
    grant usage on schema public, auth, extensions to anon, authenticated, service_role;
    create table auth.users (
      id uuid primary key,
      email text,
      phone text,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid stable language sql as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb stable language sql as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
  `);
}

async function asAuthenticated(pool: Pool, userId: string, aal: "aal1" | "aal2", sql: string, values: unknown[] = []) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [userId, JSON.stringify({ sub: userId, aal })]);
    await client.query("set local role authenticated");
    const result = await client.query(sql, values);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally { client.release(); }
}

async function asAnonymous(pool: Pool, sql: string, values: unknown[] = []) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role anon");
    const result = await client.query(sql, values);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally { client.release(); }
}

async function asService(pool: Pool, sql: string, values: unknown[] = []) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role service_role");
    await client.query("select set_config('app.p04_fixture_funding','enabled',true)");
    const result = await client.query(sql, values);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally { client.release(); }
}

async function assertInventoryWorkflow(pool: Pool) {
  const ownerId = "20000000-0000-0000-0000-000000000001";
  const unverifiedId = "20000000-0000-0000-0000-000000000002";
  const adminId = "20000000-0000-0000-0000-000000000003";
  const assetId = "30000000-0000-0000-0000-000000000001";
  await pool.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'p02-owner@example.test','{}'),($2,'p02-unverified@example.test','{}'),($3,'p02-admin@example.test','{}')", [ownerId, unverifiedId, adminId]);
  await pool.query("insert into public.platform_admins(user_id,status,mfa_required) values ($1,'active',true)", [adminId]);
  await pool.query(`insert into public.private_media_assets(id,uploader_id,purpose,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,scan_status,scan_engine,scan_completed_at,retention_until)
    values ($1,$2,'owner_verification','fixture/verification.pdf','verification.pdf','application/pdf','application/pdf',100,$3,'clean','fixture-scan',now(),now()+interval '180 days')`, [assetId, ownerId, "a".repeat(64)]);
  await asAuthenticated(pool, ownerId, "aal1", "select (public.submit_owner_verification($1::jsonb)).status", [JSON.stringify({ legalName: "Fixture Owner", businessType: "Company", registrationLast4: "A123", contactPhone: "+919876543210", address: "Kochi, Kerala, India", documentAssetIds: [assetId] })]);
  await asAuthenticated(pool, adminId, "aal2", "select (public.review_owner_verification($1,'approved',null)).status", [ownerId]);
  const listingPayload = {
    category: "led", title: "Fixture LED Screen", description: "A valid whole-day LED service used by the migration acceptance test.",
    locality: "Kochi", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999, sourceProvider: "openstreetmap", sourcePlaceId: "fixture-osm-place",
    audienceEstimate: 1000, audienceBasis: "Fixture owner estimate for a repeatable integration test.", adDurationSeconds: 10, playsPerUnit: 120,
    operatingStart: "09:00", operatingEnd: "21:00", baseRatePaise: 1200000, servicePromise: "Exclusive whole-screen placement for each approved advertised day.",
    categoryDetails: { screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, dailyCapacity: 1 }, blackouts: []
  };
  let unverifiedBlocked = false;
  try { await asAuthenticated(pool, unverifiedId, "aal1", "select public.create_inventory_listing($1::jsonb)", [JSON.stringify(listingPayload)]); } catch { unverifiedBlocked = true; }
  if (!unverifiedBlocked) throw new Error("Unverified owner unexpectedly created inventory.");
  const created = await asAuthenticated(pool, ownerId, "aal1", "select (public.create_inventory_listing($1::jsonb)).id", [JSON.stringify(listingPayload)]);
  const listingId = created.rows[0]?.id;
  if (!listingId) throw new Error("Verified owner could not create inventory.");
  const listingMediaId = "30000000-0000-0000-0000-000000000002";
  await pool.query(`insert into public.private_media_assets(id,uploader_id,purpose,listing_id,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,pixel_width,pixel_height,scan_status,scan_engine,scan_completed_at,retention_until)
    values ($1,$2,'listing_media',$3,'fixture/listing.png','listing.png','image/png','image/png',100,$4,1920,1080,'clean','fixture-scan',now(),now()+interval '365 days')`, [listingMediaId, ownerId, listingId, "c".repeat(64)]);
  await asAuthenticated(pool, ownerId, "aal1", "select public.submit_inventory_listing($1)", [listingId]);
  await asAuthenticated(pool, adminId, "aal2", "select public.review_inventory_listing($1,'published',null)", [listingId]);
  const publicRows = await pool.query("select amount_paise from public.published_inventory where id=$1", [listingId]);
  if (Number(publicRows.rows[0]?.amount_paise) !== 1200000) throw new Error("Published projection did not expose the approved initial rate.");
  let ownerRateBlocked = false;
  try { await asAuthenticated(pool, ownerId, "aal1", "select public.change_published_rate($1,1300000,'Owner should not run this','Unauthorized test')", [listingId]); } catch { ownerRateBlocked = true; }
  if (!ownerRateBlocked) throw new Error("Owner unexpectedly changed a published rate.");
  await asAuthenticated(pool, adminId, "aal2", "select public.change_published_rate($1,1300000,'Discussed with fixture owner','Scheduled published rate update')", [listingId]);
  const revised = await pool.query("select amount_paise from public.published_inventory where id=$1", [listingId]);
  if (Number(revised.rows[0]?.amount_paise) !== 1300000) throw new Error("Admin rate revision did not become current.");
  return { ownerId, unverifiedId, adminId, listingId, listingMediaId };
}

async function assertSecurityInvokerPublicViews(
  pool: Pool,
  fixture: { listingId: string; listingMediaId: string },
) {
  const options = await pool.query<{ relname: string; reloptions: string[] }>(`
    select c.relname, c.reloptions
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('published_inventory','published_listing_media')
  `);
  if (options.rows.length !== 2 || options.rows.some((row) => !row.reloptions?.includes("security_invoker=true"))) {
    throw new Error("A public discovery view is not configured as security invoker.");
  }

  const inventory = await asAnonymous(pool, "select id,amount_paise from public.published_inventory where id=$1", [fixture.listingId]);
  if (inventory.rows.length !== 1) throw new Error("Anonymous discovery could not read the published inventory view.");
  const media = await asAnonymous(pool, "select id from public.published_listing_media where id=$1", [fixture.listingMediaId]);
  if (media.rows.length !== 1) throw new Error("Anonymous discovery could not read clean published listing media.");

  let ownerColumnBlocked = false;
  try { await asAnonymous(pool, "select owner_id from public.inventory_listings where id=$1", [fixture.listingId]); } catch { ownerColumnBlocked = true; }
  if (!ownerColumnBlocked) throw new Error("Anonymous access unexpectedly exposed the inventory owner column.");
  let objectKeyBlocked = false;
  try { await asAnonymous(pool, "select object_key from public.private_media_assets where id=$1", [fixture.listingMediaId]); } catch { objectKeyBlocked = true; }
  if (!objectKeyBlocked) throw new Error("Anonymous access unexpectedly exposed a private media object key.");
}

async function assertSupportAttachmentWorkflow(
  pool: Pool,
  users: { ownerId: string; unverifiedId: string; adminId: string; listingId: string },
) {
  const ticket = await asAuthenticated(
    pool,
    users.ownerId,
    "aal1",
    "select (public.create_support_ticket($1::jsonb)).id as id",
    [JSON.stringify({ listingId: users.listingId, subject: "Fixture attachment request", message: "Please review this fixture attachment." })],
  );
  const ticketId = ticket.rows[0]?.id;
  if (!ticketId) throw new Error("Support ticket fixture was not created.");

  const attachmentId = "40000000-0000-0000-0000-000000000001";
  await pool.query(`insert into public.private_media_assets(
      id,uploader_id,purpose,support_ticket_id,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,scan_status,scan_engine,scan_completed_at,retention_until
    ) values ($1,$2,'support_attachment',$3,'fixture/support.pdf','support.pdf','application/pdf','application/pdf',100,$4,'clean','fixture-scan',now(),now()+interval '10 years')`,
    [attachmentId, users.ownerId, ticketId, "b".repeat(64)],
  );

  const requesterRead = await asAuthenticated(pool, users.ownerId, "aal1", "select id from public.private_media_assets where id=$1", [attachmentId]);
  if (requesterRead.rows.length !== 1) throw new Error("Ticket requester could not read their attachment.");
  const unrelatedRead = await asAuthenticated(pool, users.unverifiedId, "aal1", "select id from public.private_media_assets where id=$1", [attachmentId]);
  if (unrelatedRead.rows.length !== 0) throw new Error("Unrelated user unexpectedly read a ticket attachment.");
  const adminRead = await asAuthenticated(pool, users.adminId, "aal2", "select id from public.private_media_assets where id=$1", [attachmentId]);
  if (adminRead.rows.length !== 1) throw new Error("AAL2 administrator could not read a ticket attachment.");

  await asAuthenticated(pool, users.adminId, "aal2", "select (public.set_support_ticket_status($1,'closed'::public.support_ticket_status)).status", [ticketId]);
  const retention = await pool.query("select retention_until > now() + interval '179 days' and retention_until < now() + interval '181 days' as valid from public.private_media_assets where id=$1", [attachmentId]);
  if (!retention.rows[0]?.valid) throw new Error("Closing a ticket did not set the 180-day attachment retention period.");
}

async function assertPhase3QuoteWorkflow(
  pool: Pool,
  users: { ownerId: string; adminId: string; listingId: string },
) {
  const uniqueLedUnits = [{ date: "2099-01-12" }, { date: "2099-01-13" }];
  const quote = await asAuthenticated(
    pool,
    users.ownerId,
    "aal1",
    "select q.id, q.quantity from public.create_quote_snapshot($1,$2::jsonb) q",
    [users.listingId, JSON.stringify(uniqueLedUnits)],
  );
  if (quote.rows[0]?.quantity !== 2 || !quote.rows[0]?.id) throw new Error("A valid quote did not preserve its explicit LED quantity.");

  await asAuthenticated(pool, users.adminId, "aal2", "select public.change_published_rate($1,1400000,'Discussed the fixture rate update','Quote invalidation fixture')", [users.listingId]);
  const quoteCurrent = await asAuthenticated(pool, users.ownerId, "aal1", "select public.quote_snapshot_is_current($1) as current", [quote.rows[0].id]);
  if (quoteCurrent.rows[0]?.current !== false) throw new Error("A published rate change did not invalidate the earlier quote.");

  let duplicateLedBlocked = false;
  try {
    await asAuthenticated(
      pool,
      users.ownerId,
      "aal1",
      "select public.create_quote_snapshot($1,$2::jsonb)",
      [users.listingId, JSON.stringify([{ date: "2099-01-12" }, { date: "2099-01-12" }])],
    );
  } catch { duplicateLedBlocked = true; }
  if (!duplicateLedBlocked) throw new Error("A quote accepted the same LED date more than once.");

  const showStartsAt = "2099-01-15T04:30:00.000Z";
  const theatrePayload = {
    category: "theatre", title: "Fixture Theatre Screen", description: "A theatre fixture used to verify unique show capacity and blackout enforcement.",
    locality: "Kochi", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999, sourceProvider: "openstreetmap", sourcePlaceId: "fixture-osm-theatre",
    audienceEstimate: 500, audienceBasis: "Fixture owner estimate for repeatable quote validation.", adDurationSeconds: 10, playsPerUnit: 6,
    operatingStart: "09:00", operatingEnd: "23:00", baseRatePaise: 250000, servicePromise: "One advertising slot in the selected published theatre show instance.",
    categoryDetails: { venueName: "Fixture Cinema", auditoriumName: "Screen 1", slotsPerShow: 4, showStarts: [showStartsAt] }, blackouts: []
  };
  const created = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.create_inventory_listing($1::jsonb)).id", [JSON.stringify(theatrePayload)]);
  const theatreId = created.rows[0]?.id;
  if (!theatreId) throw new Error("The theatre quote fixture could not be created.");
  await asAuthenticated(pool, users.ownerId, "aal1", "select public.submit_inventory_listing($1)", [theatreId]);
  await asAuthenticated(pool, users.adminId, "aal2", "select public.review_inventory_listing($1,'published',null)", [theatreId]);
  const show = await pool.query("select id from public.theatre_show_instances where listing_id=$1", [theatreId]);
  const showId = show.rows[0]?.id;
  if (!showId) throw new Error("The theatre show fixture was not created.");

  await pool.query("insert into public.listing_blackouts(listing_id,starts_on,ends_on,reason,created_by) values($1,'2099-01-15','2099-01-15','Fixture blackout',$2)", [theatreId, users.adminId]);
  let blackedOutShowBlocked = false;
  try {
    await asAuthenticated(pool, users.ownerId, "aal1", "select public.create_quote_snapshot($1,$2::jsonb)", [theatreId, JSON.stringify([{ showInstanceId: showId, quantity: 1 }])]);
  } catch { blackedOutShowBlocked = true; }
  if (!blackedOutShowBlocked) throw new Error("A quote accepted a theatre show on a published blackout date.");

  await pool.query("delete from public.listing_blackouts where listing_id=$1", [theatreId]);
  let duplicateShowBlocked = false;
  try {
    await asAuthenticated(pool, users.ownerId, "aal1", "select public.create_quote_snapshot($1,$2::jsonb)", [theatreId, JSON.stringify([
      { showInstanceId: showId, quantity: 3 },
      { showInstanceId: showId, quantity: 3 }
    ])]);
  } catch { duplicateShowBlocked = true; }
  if (!duplicateShowBlocked) throw new Error("A quote exceeded theatre capacity by repeating the same show.");
}

async function assertPhase4BookingWorkflow(
  pool: Pool,
  users: { ownerId: string; unverifiedId: string; adminId: string; listingId: string },
) {
  const creativeId = "50000000-0000-0000-0000-000000000001";
  await pool.query(`insert into public.private_media_assets(id,uploader_id,purpose,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,pixel_width,pixel_height,scan_status,scan_engine,scan_completed_at,retention_until)
    values($1,$2,'creative','fixture/creative.png','creative.png','image/png','image/png',100,$3,1920,1080,'clean','fixture-scan',now(),now()+interval '365 days')`, [creativeId, users.ownerId, "d".repeat(64)]);
  const units = JSON.stringify([{ date: "2099-02-10" }]);
  const quote1 = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.create_quote_snapshot($1,$2::jsonb)).id", [users.listingId, units]);
  const quote2 = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.create_quote_snapshot($1,$2::jsonb)).id", [users.listingId, units]);
  const line1 = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.add_quote_to_cart($1,$2,'{}')).*", [quote1.rows[0].id, creativeId]);
  const line2 = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.add_quote_to_cart($1,$2,'{}')).*", [quote2.rows[0].id, creativeId]);
  const cartId = line1.rows[0]?.cart_id;
  if (!cartId || line2.rows[0]?.cart_id !== cartId) throw new Error("Current quotes did not join the same open cart.");
  await asAuthenticated(pool, users.ownerId, "aal1", "select public.submit_booking_cart($1)", [cartId]);
  const capturedAt = new Date().toISOString();
  await asService(pool, "select public.record_trusted_cart_payment($1,$2,$3,'p04_fixture')", [cartId, "p04-fixture-capacity", capturedAt]);

  const paid = await pool.query("select status,decision_due_at=$2::timestamptz+interval '168 hours' as exact_due from public.booking_lines where cart_id=$1 order by created_at", [cartId, capturedAt]);
  if (paid.rows.some((row) => row.status !== "paid_pending" || !row.exact_due)) throw new Error("Trusted payment did not create exact unreserved paid-pending lines.");
  const beforeApproval = await pool.query("select count(*)::int as count from public.booking_allocations where booking_line_id in ($1,$2)", [line1.rows[0].id, line2.rows[0].id]);
  if (beforeApproval.rows[0]?.count !== 0) throw new Error("Paid-pending lines unexpectedly reserved inventory.");

  let ownerDecisionBlocked = false;
  try { await asAuthenticated(pool, users.ownerId, "aal1", "select public.decide_booking_line($1,'approved','Unauthorized owner attempt',null)", [line1.rows[0].id]); } catch { ownerDecisionBlocked = true; }
  if (!ownerDecisionBlocked) throw new Error("A non-admin unexpectedly decided a booking.");
  await asAuthenticated(pool, users.adminId, "aal2", "select (public.decide_booking_line($1,'approved','Owner confirmed fixture availability',null)).status", [line1.rows[0].id]);
  let oversellBlocked = false;
  try { await asAuthenticated(pool, users.adminId, "aal2", "select public.decide_booking_line($1,'approved','Competing fixture approval',null)", [line2.rows[0].id]); } catch { oversellBlocked = true; }
  if (!oversellBlocked) throw new Error("Two LED lines acquired the same approved date.");
  await asAuthenticated(pool, users.adminId, "aal2", "select public.decide_booking_line($1,'rejected','Capacity already committed',null)", [line2.rows[0].id]);
  await asAuthenticated(pool, users.ownerId, "aal1", "select public.cancel_booking_line($1)", [line1.rows[0].id]);
  const cancelled = await pool.query("select r.refund_amount_paise,r.fee_amount_paise,l.paid_amount_paise,a.released_at is not null as released from public.refund_obligations r join public.booking_lines l on l.id=r.booking_line_id join public.booking_allocations a on a.booking_line_id=l.id where l.id=$1", [line1.rows[0].id]);
  const cancellation = cancelled.rows[0];
  if (!cancellation?.released || Number(cancellation.refund_amount_paise) * 100 !== Number(cancellation.paid_amount_paise) * 95 || Number(cancellation.fee_amount_paise) * 100 !== Number(cancellation.paid_amount_paise) * 5) throw new Error("Cancellation did not release capacity and create the exact 95/5 manual refund obligation.");

  const nearDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const quote3 = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.create_quote_snapshot($1,$2::jsonb)).id", [users.listingId, JSON.stringify([{ date: nearDate }])]);
  const newLine = await asAuthenticated(pool, users.ownerId, "aal1", "select (public.add_quote_to_cart($1,$2,'{}')).*", [quote3.rows[0].id, creativeId]);
  if (newLine.rows[0]?.cart_id === cartId) throw new Error("An addition changed frozen cart membership instead of using a new cart.");
  const unrelated = await asAuthenticated(pool, users.unverifiedId, "aal1", "select id from public.booking_lines where cart_id=$1", [cartId]);
  if (unrelated.rows.length) throw new Error("An unrelated account read another advertiser's booking lines.");
  await asAuthenticated(pool, users.ownerId, "aal1", "select public.submit_booking_cart($1)", [newLine.rows[0].cart_id]);
  await asService(pool, "select public.record_trusted_cart_payment($1,$2,$3,'p04_fixture')", [newLine.rows[0].cart_id, "p04-fixture-late-capture", new Date().toISOString()]);
  const lateCapture = await pool.query("select l.status,r.reason,r.refund_amount_paise=l.paid_amount_paise as full_refund from public.booking_lines l join public.refund_obligations r on r.booking_line_id=l.id where l.id=$1", [newLine.rows[0].id]);
  if (lateCapture.rows[0]?.status !== "payment_ineligible" || lateCapture.rows[0]?.reason !== "payment_ineligible" || !lateCapture.rows[0]?.full_refund) throw new Error("An ineligible late capture was not preserved as paid money with a full manual refund obligation.");
}

async function main() {
  loadLocalEnvFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for migration tests.");
  const parsed = new URL(databaseUrl);
  if (!parsed.pathname.toLowerCase().includes("pixlwave_test")) {
    throw new Error("Refusing destructive migration test: database name must include pixlwave_test.");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
  await resetWithAuthStubs(pool);
  await migrate(pool, "202609150001_foundation_accounts.sql");
  const userId = "10000000-0000-0000-0000-000000000001";
  await pool.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'prior@example.test',$2)", [userId, { full_name: "Prior Revision" }]);
  const profile = await pool.query("select full_name, selected_mode from public.profiles where id = $1", [userId]);
  if (profile.rows[0]?.full_name !== "Prior Revision") throw new Error("Profile trigger failed on representative prior revision.");
  await migrate(pool);
  const outbox = await pool.query("insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload,dedupe_key) values ('foundation.healthcheck','system',$1,'{}','migration-test') returning id", [userId]);
  if (!outbox.rows[0]?.id) throw new Error("Upgrade migration did not create outbox.");

  await resetWithAuthStubs(pool);
  await migrate(pool);
  const count = await pool.query("select count(*)::int as count from public.pixlwave_schema_migrations");
  const expectedMigrations = (await migrationFiles()).length;
  if (count.rows[0]?.count !== expectedMigrations) throw new Error("Fresh database did not apply every migration.");
  const inventory = await pool.query("select to_regclass('public.inventory_listings') as listings, to_regclass('public.published_inventory') as published, to_regclass('public.media_retention_cleanup_jobs') as cleanup_jobs");
  if (!inventory.rows[0]?.listings || !inventory.rows[0]?.published || !inventory.rows[0]?.cleanup_jobs) throw new Error("Inventory, public projection, or media-retention cleanup tables are missing.");
  const inventoryWorkflow = await assertInventoryWorkflow(pool);
  await assertSecurityInvokerPublicViews(pool, inventoryWorkflow);
  await assertPhase3QuoteWorkflow(pool, inventoryWorkflow);
  await assertSupportAttachmentWorkflow(pool, inventoryWorkflow);
  await assertPhase4BookingWorkflow(pool, inventoryWorkflow);
  console.log("Migration tests passed: prior-revision upgrade, empty-database replay, security-invoker public views, inventory, Phase 3 quotes/support, and Phase 4 booking workflows.");
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
