begin;

-- HiPER Premium V2 admin functionality repair.
-- Safe to run after the existing Premium V2 migration and also self-contained
-- enough to repair a production database that has not received it yet.

-- ---------------------------------------------------------------------------
-- Core permissions used by RLS
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_allowed_user() to authenticated;
grant execute on function public.set_updated_at() to authenticated;

-- ---------------------------------------------------------------------------
-- Asset catalogue premium metadata
-- ---------------------------------------------------------------------------
alter table public.asset_items
  add column if not exists asset_code text,
  add column if not exists category_bm text,
  add column if not exists category_en text,
  add column if not exists sort_order integer not null default 1;

update public.asset_items
set asset_code = 'AST-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where asset_code is null or btrim(asset_code) = '';

update public.asset_items
set category_bm = coalesce(nullif(btrim(category_bm), ''), 'Aset'),
    category_en = coalesce(nullif(btrim(category_en), ''), 'Asset'),
    sort_order = coalesce(sort_order, 1);

alter table public.asset_items
  drop constraint if exists asset_items_sort_order_check;
alter table public.asset_items
  add constraint asset_items_sort_order_check check (sort_order >= 0);

create unique index if not exists asset_items_asset_code_unique
  on public.asset_items (lower(asset_code))
  where asset_code is not null and btrim(asset_code) <> '';

create index if not exists asset_items_public_order_idx
  on public.asset_items (active, sort_order, name_bm);

-- ---------------------------------------------------------------------------
-- Organisation hierarchy
-- ---------------------------------------------------------------------------
alter table public.organization_members
  add column if not exists parent_id uuid,
  add column if not exists node_type text not null default 'member';

update public.organization_members
set node_type = 'member'
where node_type is null or node_type not in ('leadership', 'unit', 'member');

alter table public.organization_members
  drop constraint if exists organization_members_node_type_check;
alter table public.organization_members
  add constraint organization_members_node_type_check
  check (node_type in ('leadership', 'unit', 'member'));

alter table public.organization_members
  drop constraint if exists organization_members_parent_id_fkey;
alter table public.organization_members
  add constraint organization_members_parent_id_fkey
  foreign key (parent_id)
  references public.organization_members(id)
  on delete set null;

create index if not exists organization_members_parent_order_idx
  on public.organization_members (parent_id, sort_order, name);

create or replace function public.validate_organization_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'An organisation node cannot be its own parent.';
  end if;

  if exists (
    with recursive lineage as (
      select id, parent_id
      from public.organization_members
      where id = new.parent_id

      union all

      select member.id, member.parent_id
      from public.organization_members member
      join lineage on member.id = lineage.parent_id
      where lineage.parent_id is not null
    )
    select 1 from lineage where id = new.id
  ) then
    raise exception 'This parent selection would create a hierarchy cycle.';
  end if;

  return new;
end;
$function$;

revoke execute on function public.validate_organization_hierarchy()
  from public, anon, authenticated;
grant execute on function public.validate_organization_hierarchy()
  to service_role;

drop trigger if exists validate_organization_hierarchy_trigger
  on public.organization_members;
create trigger validate_organization_hierarchy_trigger
  before insert or update of parent_id
  on public.organization_members
  for each row
  execute function public.validate_organization_hierarchy();

-- ---------------------------------------------------------------------------
-- CMS settings singleton
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists set_updated_at_trigger on public.site_settings;
create trigger set_updated_at_trigger
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

insert into public.site_settings (id, settings)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Reassert admin CRUD RLS policies. These are intentionally idempotent.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage assets" on public.asset_items;
create policy "Admins manage assets"
  on public.asset_items
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage organization" on public.organization_members;
create policy "Admins manage organization"
  on public.organization_members
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage disbursements" on public.fund_disbursements;
create policy "Admins manage disbursements"
  on public.fund_disbursements
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage donation settings" on public.donation_settings;
create policy "Admins manage donation settings"
  on public.donation_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins update iKES" on public.ikes_applications;
create policy "Admins update iKES"
  on public.ikes_applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins update asset requests" on public.asset_applications;
create policy "Admins update asset requests"
  on public.asset_applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins update donations" on public.donations;
create policy "Admins update donations"
  on public.donations
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins insert donations" on public.donations;
create policy "Admins insert donations"
  on public.donations
  for insert
  to authenticated
  with check (public.is_admin());

-- Explicit table grants to remove ambiguity after remote schema changes.
grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.asset_items to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.fund_disbursements to authenticated;
grant select, insert, update, delete on public.donation_settings to authenticated;
grant select, update on public.ikes_applications to authenticated;
grant select, update on public.asset_applications to authenticated;
grant select, insert, update on public.donations to authenticated;

-- ---------------------------------------------------------------------------
-- Notification audit table required by the optional email Edge Function.
-- ---------------------------------------------------------------------------
create table if not exists public.notification_delivery_log (
  id bigint generated by default as identity primary key,
  source_table text not null check (source_table in ('ikes_applications', 'asset_applications')),
  record_id uuid not null,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  status text not null check (status in ('sent', 'skipped', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.notification_delivery_log enable row level security;
grant select on public.notification_delivery_log to authenticated;
grant all on public.notification_delivery_log to service_role;
do $do$
begin
  if to_regclass('public.notification_delivery_log_id_seq') is not null then
    execute 'grant usage, select on sequence public.notification_delivery_log_id_seq to service_role';
  end if;
end
$do$;

drop policy if exists "Admins read notification logs" on public.notification_delivery_log;
create policy "Admins read notification logs"
  on public.notification_delivery_log
  for select
  to authenticated
  using (public.is_admin());

create index if not exists notification_delivery_log_record_idx
  on public.notification_delivery_log (source_table, record_id, created_at desc);

create unique index if not exists notification_delivery_log_sent_once_idx
  on public.notification_delivery_log (source_table, record_id)
  where status = 'sent';

-- ---------------------------------------------------------------------------
-- Public media bucket + admin-only management through RLS.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Admins upload public media" on storage.objects;
create policy "Admins upload public media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "Admins update public media" on storage.objects;
create policy "Admins update public media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'public-media' and public.is_admin())
  with check (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "Admins delete public media" on storage.objects;
create policy "Admins delete public media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'public-media' and public.is_admin());

-- Keep internal stock trigger inaccessible as an RPC endpoint.
revoke execute on function public.sync_asset_stock_from_request()
  from public, anon, authenticated;

commit;
