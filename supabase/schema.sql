-- PBAK One — Supabase database, security and storage setup
-- Jalankan keseluruhan fail ini sekali dalam Supabase > SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.allowed_email_domains (
  domain text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.allowed_email_domains (domain, active)
values ('moe-dl.edu.my', true)
on conflict (domain) do update set active = excluded.active;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  class_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_email_domains d
    where d.active = true
      and lower(d.domain) = lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2))
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_allowed_user() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_allowed_user() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.email is distinct from old.email
     and current_user not in ('postgres', 'supabase_admin')
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Profile email is managed by the authentication system.';
  end if;

  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin')
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Only an administrator can change user roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute procedure public.protect_profile_role();

-- Backfill profiles if Auth users already existed before this script was installed.
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.email, '')
from auth.users u
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

create table if not exists public.ikes_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  applicant_name text not null,
  class_name text not null,
  phone text not null,
  ikes_type text not null check (ikes_type in ('care', 'go_home')),
  amount numeric(10,2) not null check (
    (ikes_type = 'care' and amount in (30, 50))
    or (ikes_type = 'go_home' and amount > 0 and amount <= 100)
  ),
  reason text not null,
  ticket_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  admin_notes text,
  repayment_due_at date,
  repaid_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ikes_applications
  drop constraint if exists ikes_go_home_ticket_required;
alter table public.ikes_applications
  add constraint ikes_go_home_ticket_required
  check (ikes_type <> 'go_home' or ticket_path is not null);

create table if not exists public.asset_items (
  id uuid primary key default gen_random_uuid(),
  name_bm text not null,
  name_en text,
  description_bm text,
  description_en text,
  stock_total integer not null default 0 check (stock_total >= 0),
  stock_available integer not null default 0 check (stock_available >= 0 and stock_available <= stock_total),
  active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  applicant_name text not null,
  class_name text not null,
  phone text not null,
  asset_id uuid not null references public.asset_items(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  borrow_date date not null,
  return_date date not null check (return_date >= borrow_date),
  purpose text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  admin_notes text,
  returned_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_asset_stock_from_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
begin
  if old.status <> 'approved' and new.status = 'approved' then
    update public.asset_items
    set stock_available = stock_available - new.quantity
    where id = new.asset_id
      and active = true
      and stock_available >= new.quantity;

    get diagnostics affected_rows = row_count;
    if affected_rows = 0 then
      raise exception 'Insufficient available stock for this asset.';
    end if;
  elsif old.status = 'approved' and new.status <> 'approved' then
    update public.asset_items
    set stock_available = least(stock_total, stock_available + old.quantity)
    where id = old.asset_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_asset_stock_trigger on public.asset_applications;
create trigger sync_asset_stock_trigger
before update of status on public.asset_applications
for each row execute procedure public.sync_asset_stock_from_request();

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  donor_name text,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('qr', 'bank_transfer', 'cash')),
  proof_path text,
  reference_no text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.donations
  drop constraint if exists non_cash_donation_proof_required;
alter table public.donations
  add constraint non_cash_donation_proof_required
  check (payment_method = 'cash' or proof_path is not null);

create table if not exists public.fund_disbursements (
  id uuid primary key default gen_random_uuid(),
  title_bm text not null,
  title_en text,
  description_bm text,
  description_en text,
  amount numeric(12,2) not null check (amount > 0),
  disbursed_at date not null default current_date,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donation_settings (
  id integer primary key default 1 check (id = 1),
  bank_name text,
  account_name text,
  account_number text,
  qr_url text,
  note_bm text,
  note_en text,
  updated_at timestamptz not null default now()
);

insert into public.donation_settings (id, bank_name, account_name, account_number, note_bm, note_en)
values (
  1,
  'Tetapkan nama bank',
  'JPP IPG Kampus Kota Bharu',
  'Tetapkan nombor akaun',
  'Sila gunakan akaun rasmi yang dipaparkan sahaja.',
  'Please use only the official account displayed here.'
)
on conflict (id) do nothing;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_bm text not null,
  title_en text,
  content_bm text not null,
  content_en text,
  poster_url text,
  published boolean not null default true,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 1,
  name text not null,
  position_bm text not null,
  position_en text,
  unit_bm text,
  unit_en text,
  class_name text,
  duties_bm text,
  duties_en text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at triggers
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'ikes_applications', 'asset_items', 'asset_applications',
    'donations', 'fund_disbursements', 'donation_settings',
    'announcements', 'organization_members'
  ]
  LOOP
    EXECUTE format('drop trigger if exists set_updated_at_trigger on public.%I', table_name);
    EXECUTE format(
      'create trigger set_updated_at_trigger before update on public.%I for each row execute procedure public.set_updated_at()',
      table_name
    );
  END LOOP;
END;
$$;

-- Row Level Security
alter table public.allowed_email_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.ikes_applications enable row level security;
alter table public.asset_items enable row level security;
alter table public.asset_applications enable row level security;
alter table public.donations enable row level security;
alter table public.fund_disbursements enable row level security;
alter table public.donation_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.organization_members enable row level security;

-- Clean policies so the file can be run again safely.
drop policy if exists "Admins manage allowed domains" on public.allowed_email_domains;
create policy "Admins manage allowed domains" on public.allowed_email_domains
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
for select to authenticated using ((id = auth.uid() and public.is_allowed_user()) or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated using ((id = auth.uid() and public.is_allowed_user()) or public.is_admin())
with check ((id = auth.uid() and public.is_allowed_user()) or public.is_admin());

drop policy if exists "Users submit iKES" on public.ikes_applications;
create policy "Users submit iKES" on public.ikes_applications
for insert to authenticated with check (user_id = auth.uid() and public.is_allowed_user());

drop policy if exists "Users read own iKES" on public.ikes_applications;
create policy "Users read own iKES" on public.ikes_applications
for select to authenticated using ((user_id = auth.uid() and public.is_allowed_user()) or public.is_admin());

drop policy if exists "Admins update iKES" on public.ikes_applications;
create policy "Admins update iKES" on public.ikes_applications
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active assets" on public.asset_items;
create policy "Public read active assets" on public.asset_items
for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "Admins manage assets" on public.asset_items;
create policy "Admins manage assets" on public.asset_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users submit asset requests" on public.asset_applications;
create policy "Users submit asset requests" on public.asset_applications
for insert to authenticated with check (user_id = auth.uid() and public.is_allowed_user());

drop policy if exists "Users read own asset requests" on public.asset_applications;
create policy "Users read own asset requests" on public.asset_applications
for select to authenticated using ((user_id = auth.uid() and public.is_allowed_user()) or public.is_admin());

drop policy if exists "Admins update asset requests" on public.asset_applications;
create policy "Admins update asset requests" on public.asset_applications
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users submit donations" on public.donations;
create policy "Users submit donations" on public.donations
for insert to authenticated with check (user_id = auth.uid() and public.is_allowed_user());

drop policy if exists "Users read own donations" on public.donations;
create policy "Users read own donations" on public.donations
for select to authenticated using ((user_id = auth.uid() and public.is_allowed_user()) or public.is_admin());

drop policy if exists "Admins update donations" on public.donations;
create policy "Admins update donations" on public.donations
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read public disbursements" on public.fund_disbursements;
create policy "Public read public disbursements" on public.fund_disbursements
for select to anon, authenticated using (is_public = true or public.is_admin());

drop policy if exists "Admins manage disbursements" on public.fund_disbursements;
create policy "Admins manage disbursements" on public.fund_disbursements
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read donation settings" on public.donation_settings;
create policy "Public read donation settings" on public.donation_settings
for select to anon, authenticated using (true);

drop policy if exists "Admins manage donation settings" on public.donation_settings;
create policy "Admins manage donation settings" on public.donation_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published announcements" on public.announcements;
create policy "Public read published announcements" on public.announcements
for select to anon, authenticated using (published = true or public.is_admin());

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements" on public.announcements
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active organization" on public.organization_members;
create policy "Public read active organization" on public.organization_members
for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "Admins manage organization" on public.organization_members;
create policy "Admins manage organization" on public.organization_members
for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- API privileges. RLS policies below still control which rows are accessible.
grant usage on schema public to anon, authenticated;
grant select on public.asset_items, public.fund_disbursements, public.donation_settings,
  public.announcements, public.organization_members to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Public aggregate. Donor identities and individual records remain private.
create or replace function public.get_public_fund_summary()
returns table(total_verified numeric, total_disbursed numeric, balance numeric)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select coalesce(sum(amount), 0)::numeric as verified
    from public.donations
    where status = 'verified'
  ),
  distributed as (
    select coalesce(sum(amount), 0)::numeric as spent
    from public.fund_disbursements
  )
  select totals.verified, distributed.spent, (totals.verified - distributed.spent)::numeric
  from totals cross join distributed;
$$;

grant execute on function public.get_public_fund_summary() to anon, authenticated;

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-files',
  'application-files',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Public reads public media" on storage.objects;
create policy "Public reads public media" on storage.objects
for select to anon, authenticated using (bucket_id = 'public-media');

drop policy if exists "Admins upload public media" on storage.objects;
create policy "Admins upload public media" on storage.objects
for insert to authenticated with check (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "Admins update public media" on storage.objects;
create policy "Admins update public media" on storage.objects
for update to authenticated using (bucket_id = 'public-media' and public.is_admin())
with check (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "Admins delete public media" on storage.objects;
create policy "Admins delete public media" on storage.objects
for delete to authenticated using (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "Users upload own application files" on storage.objects;
create policy "Users upload own application files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'application-files'
  and public.is_allowed_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users read own application files" on storage.objects;
create policy "Users read own application files" on storage.objects
for select to authenticated using (
  bucket_id = 'application-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "Users delete own application files" on storage.objects;
create policy "Users delete own application files" on storage.objects
for delete to authenticated using (
  bucket_id = 'application-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- Sample content. Delete or edit through the admin panel later.
insert into public.announcements (title_bm, title_en, content_bm, content_en, published, pinned)
select
  'Selamat Datang ke PBAK One',
  'Welcome to PBAK One',
  'Portal bersepadu kebajikan dan perkhidmatan Pejabat Bendahari Agung Kehormat.',
  'The integrated welfare and services portal of the Office of the Honorary Treasurer General.',
  true,
  true
where not exists (select 1 from public.announcements);

insert into public.asset_items (name_bm, name_en, description_bm, description_en, stock_total, stock_available)
select 'Projektor', 'Projector', 'Aset contoh untuk aktiviti rasmi.', 'Sample asset for official activities.', 2, 2
where not exists (select 1 from public.asset_items);

-- SELEPAS admin pertama log masuk, jalankan arahan ini secara berasingan:
-- update public.profiles set role = 'admin' where email = 'EMAIL_DELIMA_ADMIN_ANDA';
