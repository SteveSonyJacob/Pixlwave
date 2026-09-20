alter table public.private_media_assets
  add column if not exists support_ticket_id uuid references public.support_tickets(id) on delete restrict;

alter table public.private_media_assets
  drop constraint if exists private_media_support_attachment_scope;
alter table public.private_media_assets
  add constraint private_media_support_attachment_scope check (
    (purpose = 'support_attachment' and support_ticket_id is not null and listing_id is null)
    or purpose <> 'support_attachment'
  );

create index if not exists private_media_support_ticket on public.private_media_assets(support_ticket_id, created_at)
  where purpose = 'support_attachment';

-- A requester may read attachments attached to their own ticket. Admin access
-- remains AAL2-only; ownership checks are repeated in the signed download route.
drop policy if exists private_media_read_scoped on public.private_media_assets;
create policy private_media_read_scoped on public.private_media_assets for select to authenticated using (
  uploader_id = auth.uid()
  or public.is_admin_aal2()
  or (purpose = 'support_attachment' and exists(
    select 1 from public.support_tickets t where t.id = support_ticket_id and t.requester_id = auth.uid()
  ))
);

create or replace function public.set_ticket_attachment_retention()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status <> 'closed' and new.status = 'closed' then
    update public.private_media_assets
    set retention_until = now() + interval '180 days'
    where support_ticket_id = new.id and purpose = 'support_attachment';
  end if;
  return new;
end;
$$;

drop trigger if exists support_ticket_attachment_retention on public.support_tickets;
create trigger support_ticket_attachment_retention after update of status on public.support_tickets
for each row execute function public.set_ticket_attachment_retention();

comment on column public.private_media_assets.support_ticket_id is 'Private support attachment linkage. Retention becomes 180 days from ticket closure.';
