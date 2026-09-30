import { execFileSync, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

// Uses an existing local PostgreSQL container, never DATABASE_URL or Supabase.
const container = process.env.PIXLWAVE_TEST_CONTAINER || "pixlwave-test-db";
const database = `pixlwave_test_drafts_${randomUUID().replaceAll("-", "")}`;
const args = ["exec", "-i", container, "psql", "-X", "-q", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database];
const run = (sql) => execFileSync("docker", args, { input: `set client_min_messages=warning; ${sql}`, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const owner = "20000000-0000-0000-0000-000000000001";
const other = "20000000-0000-0000-0000-000000000002";
const unverified = "20000000-0000-0000-0000-000000000003";
const draft = "40000000-0000-0000-0000-000000000001";
const edit = "40000000-0000-0000-0000-000000000002";
const race = "40000000-0000-0000-0000-000000000003";
const asUser = (id) => `reset role; select set_config('request.jwt.claim.sub','${id}',false); select set_config('request.jwt.claims','{"sub":"${id}","aal":"aal1"}',false); set role authenticated;`;
const asAdmin = (id) => `reset role; select set_config('request.jwt.claim.sub','${id}',false); select set_config('request.jwt.claims','{"sub":"${id}","aal":"aal2"}',false); set role authenticated;`;
const listing = JSON.stringify({
  category: "led", title: "Autosave test screen", description: "An isolated draft migration fixture in central Kochi.", locality: "Kochi", district: "Ernakulam",
  latitude: 9.9816, longitude: 76.2999, sourceProvider: "manual", sourcePlaceId: "manual-pin", audienceEstimate: 1000, audienceBasis: "Fixture estimate for local migration testing.",
  adDurationSeconds: 10, playsPerUnit: 120, operatingStart: "09:00", operatingEnd: "21:00", baseRatePaise: 1200000,
  servicePromise: "One advertiser receives exclusive use of the screen per day.", categoryDetails: { screenWidthPx: 1920, screenHeightPx: 1080, physicalWidthMetres: 6, physicalHeightMetres: 3.4, dailyCapacity: 1 }, blackouts: []
});
let created = false;
try {
  execFileSync("docker", ["exec", container, "createdb", "-U", "postgres", database]);
  created = true;
  run(`create schema auth; create schema extensions;
    do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
    do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
    grant usage on schema public,auth,extensions to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,phone text,raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid stable language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb stable language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;`);
  for (const file of readdirSync("supabase/migrations").filter((name) => name.endsWith(".sql")).sort()) {
    run(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  run(`insert into auth.users(id,email) values ('${owner}','draft-owner@example.test'),('${other}','draft-other@example.test'),('${unverified}','draft-unverified@example.test');
    insert into public.owner_verifications(owner_id,status,legal_name,business_type,registration_last4,contact_phone,address,document_asset_ids,reviewed_at,reviewed_by)
    select id,'approved','Fixture Owner','Company','A123','+919876543210','Kochi, Kerala, India',array['30000000-0000-0000-0000-000000000001'::uuid],now(),'${owner}'::uuid
    from auth.users where id in ('${owner}','${other}');
    ${asUser(owner)}
    do $$ declare saved public.owner_listing_drafts; begin
      saved := public.save_owner_listing_draft('${draft}',0,'{"title":"Partial"}',0);
      if saved.revision <> 1 then raise exception 'First checkpoint revision mismatch'; end if;
      saved := public.save_owner_listing_draft('${draft}',0,'{"title":"Partial"}',0);
      if saved.revision <> 1 then raise exception 'Retry incremented revision'; end if;
      begin perform public.save_owner_listing_draft('${draft}',0,'{"title":"Stale"}',0); raise exception 'Stale write succeeded'; exception when serialization_failure then null; end;
      saved := public.save_owner_listing_draft('${draft}',1,'{"title":"Second"}',1);
      if saved.revision <> 2 then raise exception 'Second checkpoint revision mismatch'; end if;
      begin update public.owner_listing_drafts set payload='{}'; raise exception 'Direct writes allowed'; exception when insufficient_privilege then null; end;
      begin perform public.save_owner_listing_draft('${edit}',0,jsonb_build_object('title',repeat('x',262145)),0); raise exception 'Oversized payload accepted'; exception when invalid_parameter_value then null; end;
    end $$;
    ${asUser(other)}
    do $$ begin
      if exists(select 1 from public.owner_listing_drafts) then raise exception 'Cross-owner RLS leak'; end if;
      begin perform public.save_owner_listing_draft('${draft}',2,'{}',0); raise exception 'Cross-owner update succeeded'; exception when insufficient_privilege then null; end;
      begin perform public.commit_owner_listing_draft('${draft}',2,'${listing}'); raise exception 'Cross-owner commit succeeded'; exception when insufficient_privilege then null; end;
    end $$;
    ${asUser(unverified)}
    do $$ begin
      begin perform public.save_owner_listing_draft('${edit}',0,'{}',0); raise exception 'Unverified owner saved'; exception when insufficient_privilege then null; end;
    end $$;
    reset role; set role anon;
    do $$ begin
      begin perform 1 from public.owner_listing_drafts; raise exception 'Anonymous draft read succeeded'; exception when insufficient_privilege then null; end;
      begin perform public.save_owner_listing_draft('${edit}',0,'{}',0); raise exception 'Anonymous draft write succeeded'; exception when insufficient_privilege then null; end;
    end $$;
    ${asUser(owner)}
    do $$ declare first_id uuid; retry_id uuid; stamp timestamptz; begin
      first_id := public.commit_owner_listing_draft('${draft}',2,'${listing}');
      retry_id := public.commit_owner_listing_draft('${draft}',2,'${listing}');
      if first_id <> retry_id or (select count(*) from public.inventory_listings) <> 1 then raise exception 'Commit was not idempotent'; end if;
      if (select status from public.inventory_listings where id=first_id) <> 'draft' then raise exception 'Checkpoint published inventory'; end if;
      select updated_at into stamp from public.inventory_listings where id=first_id;
      perform public.save_owner_listing_draft('${edit}',0,'{}',0,first_id,stamp);
    end $$;
    -- A separate transaction changes the underlying listing while its checkpoint stays open.
    select public.update_inventory_listing(result_listing_id,'${listing}') from public.owner_listing_drafts where id='${draft}';
    do $$ declare saved public.owner_listing_drafts; fresh_id uuid; committed_id uuid; begin
      select * into saved from public.owner_listing_drafts where id='${edit}';
      begin perform public.save_owner_listing_draft(saved.id,1,'{}',1,saved.listing_id,saved.base_updated_at); raise exception 'Stale base listing accepted'; exception when serialization_failure then null; end;
      begin perform public.commit_owner_listing_draft(saved.id,1,'${listing}'); raise exception 'Stale base commit accepted'; exception when serialization_failure then null; end;
      perform public.discard_owner_listing_draft(saved.id,1);
      begin perform public.commit_owner_listing_draft(saved.id,1,'${listing}'); raise exception 'Discarded draft committed'; exception when serialization_failure then null; end;
      fresh_id := extensions.gen_random_uuid();
      perform public.save_owner_listing_draft(fresh_id,0,'{}',0,saved.listing_id,(select updated_at from public.inventory_listings where id=saved.listing_id));
      begin perform public.commit_owner_listing_draft(fresh_id,1,jsonb_set('${listing}'::jsonb,'{baseRatePaise}','1')); raise exception 'Invalid commit succeeded'; exception when check_violation then null; end;
      if (select status from public.owner_listing_drafts where id=fresh_id) <> 'active' then raise exception 'Failed commit consumed checkpoint'; end if;
      committed_id := public.commit_owner_listing_draft(fresh_id,1,'${listing}');
      if committed_id <> saved.listing_id then raise exception 'Editing checkpoint created a different listing'; end if;
      perform public.save_owner_listing_draft('${race}',0,'{}',0);
    end $$;`);
  const writes = await Promise.allSettled(["Tab A", "Tab B"].map((title) => promisify(execFile)("docker", [...args, "-c", `${asUser(owner)} select public.save_owner_listing_draft('${race}',1,'{"title":"${title}"}',1);`])));
  if (writes.filter((result) => result.status === "fulfilled").length !== 1 || writes.filter((result) => result.status === "rejected").length !== 1) throw new Error("Concurrent writers did not produce exactly one accepted checkpoint.");
  const revisedListing = JSON.stringify({ ...JSON.parse(listing), title: "Approved replacement screen" });
  run(`reset role;
    insert into public.platform_admins(user_id,status,mfa_required) values ('${owner}','active',true);
    insert into public.private_media_assets(id,uploader_id,purpose,listing_id,object_key,original_name,declared_mime,detected_mime,byte_size,sha256,pixel_width,pixel_height,scan_status,scan_engine,scan_completed_at,retention_until)
    select '30000000-0000-0000-0000-000000000010','${owner}','listing_media',result_listing_id,'fixture/original.png','original.png','image/png','image/png',100,repeat('d',64),1920,1080,'clean','fixture',now(),now()+interval '1 year'
    from public.owner_listing_drafts where id='${draft}';
    ${asUser(owner)}
    select public.submit_inventory_listing(result_listing_id) from public.owner_listing_drafts where id='${draft}';
    ${asAdmin(owner)}
    select public.review_inventory_listing(result_listing_id,'published',null) from public.owner_listing_drafts where id='${draft}';
    ${asUser(owner)}
    do $$ declare target_id uuid; replacement public.inventory_listing_revisions; begin
      select result_listing_id into target_id from public.owner_listing_drafts where id='${draft}';
      replacement := public.save_inventory_listing_revision(target_id,'${revisedListing}');
      if (select title from public.published_inventory where id=target_id) = 'Approved replacement screen' then raise exception 'Draft replacement changed public inventory'; end if;
      begin perform public.save_inventory_listing_revision(target_id,jsonb_set('${revisedListing}'::jsonb,'{baseRatePaise}','1300000')); raise exception 'Owner changed published rate through revision'; exception when insufficient_privilege then null; end;
      perform public.submit_inventory_listing_revision(replacement.id);
    end $$;
    ${asAdmin(owner)}
    select public.review_inventory_listing_revision(id,'approved',null) from public.inventory_listing_revisions where listing_id=(select result_listing_id from public.owner_listing_drafts where id='${draft}') and status='submitted';
    do $$ declare target_id uuid; begin
      select result_listing_id into target_id from public.owner_listing_drafts where id='${draft}';
      if (select title from public.published_inventory where id=target_id) <> 'Approved replacement screen' then raise exception 'Approved replacement did not become public'; end if;
      if (select count(*) from public.listing_status_events where listing_id=target_id and event_type in ('revision.submitted','revision.approved')) <> 2 then raise exception 'Revision history missing'; end if;
    end $$;`);
  console.log("Owner draft and revision migration tests passed: all migrations replayed; RLS, autosave conflicts, stable published replacements, admin approval, rate ownership and persisted status history verified.");
} finally {
  if (created && /^pixlwave_test_drafts_[a-f0-9]{32}$/.test(database)) execFileSync("docker", ["exec", container, "dropdb", "-U", "postgres", database]);
}
