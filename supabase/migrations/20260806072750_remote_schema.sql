-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.get_public_fund_summary()
  RETURNS TABLE (
    total_verified  numeric,
    total_disbursed numeric,
    balance         numeric
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT ALL ON FUNCTION public.get_public_fund_summary() TO anon;

GRANT ALL ON FUNCTION public.get_public_fund_summary() TO authenticated;

GRANT ALL ON FUNCTION public.get_public_fund_summary() TO service_role;

CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  is_appointed_admin boolean;
begin
  select exists (
    select 1
    from public.admin_email_allowlist a
    where lower(trim(a.email)) =
          lower(trim(coalesce(new.email, '')))
      and a.active = true
  )
  into is_appointed_admin;

  insert into public.profiles (
    id,
    full_name,
    email,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    lower(trim(coalesce(new.email, ''))),
    case
      when is_appointed_admin then 'admin'
      else 'user'
    end
  )
  on conflict (id)
  do update set
    full_name = coalesce(
      nullif(excluded.full_name, ''),
      public.profiles.full_name
    ),
    email = excluded.email,

    -- Jika ada dalam allowlist, jadikan admin.
    -- Jika tiada, kekalkan peranan sedia ada.
    role = case
      when is_appointed_admin then 'admin'
      else public.profiles.role
    end,

    updated_at = now();

  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

CREATE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$function$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;

GRANT ALL ON FUNCTION public.is_admin() TO anon;

GRANT ALL ON FUNCTION public.is_admin() TO authenticated;

GRANT ALL ON FUNCTION public.is_admin() TO service_role;

CREATE FUNCTION public.is_allowed_user()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.allowed_email_domains d
    where d.active = true
      and lower(d.domain) = lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2))
  );
$function$;

REVOKE ALL ON FUNCTION public.is_allowed_user() FROM PUBLIC;

GRANT ALL ON FUNCTION public.is_allowed_user() TO anon;

GRANT ALL ON FUNCTION public.is_allowed_user() TO authenticated;

GRANT ALL ON FUNCTION public.is_allowed_user() TO service_role;

CREATE FUNCTION public.protect_profile_role()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
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
$function$;

GRANT ALL ON FUNCTION public.protect_profile_role() TO anon;

GRANT ALL ON FUNCTION public.protect_profile_role() TO authenticated;

GRANT ALL ON FUNCTION public.protect_profile_role() TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'pg_catalog'
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE FUNCTION public.sync_asset_stock_from_request()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.sync_asset_stock_from_request() FROM PUBLIC;

GRANT ALL ON FUNCTION public.sync_asset_stock_from_request() TO service_role;

CREATE FUNCTION public.update_my_profile (
  new_full_name  text,
  new_class_name text
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
begin
  update public.profiles
  set
    full_name = nullif(trim(new_full_name), ''),
    class_name = nullif(trim(new_class_name), ''),
    updated_at = now()
  where id = auth.uid();
end;
$function$;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text) FROM PUBLIC;

GRANT ALL ON FUNCTION public.update_my_profile(text, text) TO authenticated;

GRANT ALL ON FUNCTION public.update_my_profile(text, text) TO service_role;

CREATE TABLE public.admin_email_allowlist (
  email      text                     NOT NULL,
  active     boolean                  DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_email_allowlist
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_email_allowlist
  ADD CONSTRAINT admin_email_allowlist_pkey PRIMARY KEY (email);

ALTER TABLE public.admin_email_allowlist
  ADD CONSTRAINT admin_email_must_be_lowercase CHECK (email = lower(TRIM(BOTH FROM email)));

GRANT ALL ON public.admin_email_allowlist TO service_role;

CREATE UNIQUE INDEX only_one_active_external_admin ON public.admin_email_allowlist (active)
  WHERE active = true AND split_part(email, '@'::text, 2) <> 'moe-dl.edu.my'::text;

CREATE TABLE public.allowed_email_domains (
  domain     text                     NOT NULL,
  active     boolean                  DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.allowed_email_domains
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.allowed_email_domains
  ADD CONSTRAINT allowed_email_domains_pkey PRIMARY KEY (DOMAIN);

GRANT ALL ON public.allowed_email_domains TO anon;

GRANT ALL ON public.allowed_email_domains TO authenticated;

GRANT ALL ON public.allowed_email_domains TO service_role;

CREATE POLICY "Admins manage allowed domains" ON public.allowed_email_domains
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE public.announcements (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  title_bm   text                     NOT NULL,
  title_en   text,
  content_bm text                     NOT NULL,
  content_en text,
  poster_url text,
  published  boolean                  DEFAULT true NOT NULL,
  pinned     boolean                  DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);

GRANT ALL ON public.announcements TO anon;

GRANT ALL ON public.announcements TO authenticated;

GRANT ALL ON public.announcements TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage announcements" ON public.announcements
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public read published announcements" ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (((published = true) OR public.is_admin()));

CREATE TABLE public.asset_applications (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid                     NOT NULL,
  applicant_name text                     NOT NULL,
  class_name     text                     NOT NULL,
  phone          text                     NOT NULL,
  asset_id       uuid                     NOT NULL,
  quantity       integer                  DEFAULT 1 NOT NULL,
  borrow_date    date                     NOT NULL,
  return_date    date                     NOT NULL,
  purpose        text                     NOT NULL,
  status         text                     DEFAULT 'pending'::text NOT NULL,
  admin_notes    text,
  returned_at    date,
  created_at     timestamp with time zone DEFAULT now() NOT NULL,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.asset_applications
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_check CHECK (return_date >= borrow_date);

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_pkey PRIMARY KEY (id);

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_quantity_check CHECK (quantity > 0);

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'completed'::text]));

GRANT ALL ON public.asset_applications TO anon;

GRANT ALL ON public.asset_applications TO authenticated;

GRANT ALL ON public.asset_applications TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.asset_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sync_asset_stock_trigger
  BEFORE UPDATE OF status ON public.asset_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_asset_stock_from_request();

CREATE POLICY "Admins update asset requests" ON public.asset_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users read own asset requests" ON public.asset_applications
  FOR SELECT
  TO authenticated
  USING ((((user_id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()));

CREATE POLICY "Users submit asset requests" ON public.asset_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (((user_id = auth.uid()) AND public.is_allowed_user() AND (status = 'pending'::text) AND (admin_notes IS NULL) AND (returned_at IS NULL)));

CREATE TABLE public.asset_items (
  id              uuid                     DEFAULT gen_random_uuid() NOT NULL,
  name_bm         text                     NOT NULL,
  name_en         text,
  description_bm  text,
  description_en  text,
  stock_total     integer                  DEFAULT 0 NOT NULL,
  stock_available integer                  DEFAULT 0 NOT NULL,
  active          boolean                  DEFAULT true NOT NULL,
  image_url       text,
  created_at      timestamp with time zone DEFAULT now() NOT NULL,
  updated_at      timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.asset_items
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.asset_items
  ADD CONSTRAINT asset_items_check CHECK (stock_available >= 0 AND stock_available <= stock_total);

ALTER TABLE public.asset_items
  ADD CONSTRAINT asset_items_pkey PRIMARY KEY (id);

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset_items(id) ON DELETE RESTRICT;

ALTER TABLE public.asset_items
  ADD CONSTRAINT asset_items_stock_total_check CHECK (stock_total >= 0);

GRANT ALL ON public.asset_items TO anon;

GRANT ALL ON public.asset_items TO authenticated;

GRANT ALL ON public.asset_items TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.asset_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage assets" ON public.asset_items
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public read active assets" ON public.asset_items
  FOR SELECT
  TO anon, authenticated
  USING (((active = true) OR public.is_admin()));

CREATE TABLE public.donation_settings (
  id             integer                  DEFAULT 1 NOT NULL,
  bank_name      text,
  account_name   text,
  account_number text,
  qr_url         text,
  note_bm        text,
  note_en        text,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.donation_settings
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donation_settings
  ADD CONSTRAINT donation_settings_id_check CHECK (id = 1);

ALTER TABLE public.donation_settings
  ADD CONSTRAINT donation_settings_pkey PRIMARY KEY (id);

GRANT ALL ON public.donation_settings TO anon;

GRANT ALL ON public.donation_settings TO authenticated;

GRANT ALL ON public.donation_settings TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.donation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage donation settings" ON public.donation_settings
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public read donation settings" ON public.donation_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.donations (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid                     NOT NULL,
  donor_name     text,
  amount         numeric(12,2)            NOT NULL,
  payment_method text                     NOT NULL,
  proof_path     text,
  reference_no   text,
  message        text,
  status         text                     DEFAULT 'pending'::text NOT NULL,
  created_at     timestamp with time zone DEFAULT now() NOT NULL,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.donations
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_amount_check CHECK (amount > 0::numeric);

ALTER TABLE public.donations
  ADD CONSTRAINT donations_payment_method_check CHECK (payment_method = ANY (ARRAY['qr'::text, 'bank_transfer'::text, 'cash'::text]));

ALTER TABLE public.donations
  ADD CONSTRAINT donations_pkey PRIMARY KEY (id);

ALTER TABLE public.donations
  ADD CONSTRAINT donations_status_check CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]));

ALTER TABLE public.donations
  ADD CONSTRAINT non_cash_donation_proof_required CHECK (payment_method = 'cash'::text OR proof_path IS NOT NULL);

GRANT ALL ON public.donations TO anon;

GRANT ALL ON public.donations TO authenticated;

GRANT ALL ON public.donations TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins update donations" ON public.donations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users read own donations" ON public.donations
  FOR SELECT
  TO authenticated
  USING ((((user_id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()));

CREATE POLICY "Users submit donations" ON public.donations
  FOR INSERT
  TO authenticated
  WITH
    CHECK
    (((user_id = auth.uid()) AND public.is_allowed_user() AND (status = 'pending'::text) AND ((proof_path IS NULL) OR (split_part(proof_path, '/'::text, 1) = (auth.uid())::text))));

CREATE TABLE public.fund_disbursements (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  title_bm       text                     NOT NULL,
  title_en       text,
  description_bm text,
  description_en text,
  amount         numeric(12,2)            NOT NULL,
  disbursed_at   date                     DEFAULT CURRENT_DATE NOT NULL,
  is_public      boolean                  DEFAULT true NOT NULL,
  created_at     timestamp with time zone DEFAULT now() NOT NULL,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.fund_disbursements
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fund_disbursements
  ADD CONSTRAINT fund_disbursements_amount_check CHECK (amount > 0::numeric);

ALTER TABLE public.fund_disbursements
  ADD CONSTRAINT fund_disbursements_pkey PRIMARY KEY (id);

GRANT ALL ON public.fund_disbursements TO anon;

GRANT ALL ON public.fund_disbursements TO authenticated;

GRANT ALL ON public.fund_disbursements TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.fund_disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage disbursements" ON public.fund_disbursements
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public read public disbursements" ON public.fund_disbursements
  FOR SELECT
  TO anon, authenticated
  USING (((is_public = true) OR public.is_admin()));

CREATE TABLE public.ikes_applications (
  id               uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id          uuid                     NOT NULL,
  applicant_name   text                     NOT NULL,
  class_name       text                     NOT NULL,
  phone            text                     NOT NULL,
  ikes_type        text                     NOT NULL,
  amount           numeric(10,2)            NOT NULL,
  reason           text                     NOT NULL,
  ticket_path      text,
  status           text                     DEFAULT 'pending'::text NOT NULL,
  admin_notes      text,
  repayment_due_at date,
  repaid_at        date,
  created_at       timestamp with time zone DEFAULT now() NOT NULL,
  updated_at       timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ikes_applications
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_applications_check
    CHECK (ikes_type = 'care'::text AND (amount = ANY (ARRAY[30::numeric, 50::numeric])) OR ikes_type = 'go_home'::text AND amount > 0::numeric AND amount <= 100::numeric);

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_applications_ikes_type_check CHECK (ikes_type = ANY (ARRAY['care'::text, 'go_home'::text]));

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_applications_pkey PRIMARY KEY (id);

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_applications_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'completed'::text]));

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_go_home_ticket_required CHECK (ikes_type <> 'go_home'::text OR ticket_path IS NOT NULL);

GRANT ALL ON public.ikes_applications TO anon;

GRANT ALL ON public.ikes_applications TO authenticated;

GRANT ALL ON public.ikes_applications TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.ikes_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins update iKES" ON public.ikes_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users read own iKES" ON public.ikes_applications
  FOR SELECT
  TO authenticated
  USING ((((user_id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()));

CREATE POLICY "Users submit iKES" ON public.ikes_applications
  FOR INSERT
  TO authenticated
  WITH
    CHECK
    (((user_id = auth.uid()) AND public.is_allowed_user() AND (status = 'pending'::text) AND (admin_notes IS NULL) AND (repayment_due_at IS NULL) AND (repaid_at IS NULL) AND
    ((ticket_path IS NULL) OR (split_part(ticket_path, '/'::text, 1) = (auth.uid())::text))));

CREATE TABLE public.organization_members (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  sort_order  integer                  DEFAULT 1 NOT NULL,
  name        text                     NOT NULL,
  position_bm text                     NOT NULL,
  position_en text,
  unit_bm     text,
  unit_en     text,
  class_name  text,
  duties_bm   text,
  duties_en   text,
  photo_url   text,
  active      boolean                  DEFAULT true NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.organization_members
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);

GRANT ALL ON public.organization_members TO anon;

GRANT ALL ON public.organization_members TO authenticated;

GRANT ALL ON public.organization_members TO service_role;

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage organization" ON public.organization_members
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public read active organization" ON public.organization_members
  FOR SELECT
  TO anon, authenticated
  USING (((active = true) OR public.is_admin()));

CREATE TABLE public.profiles (
  id         uuid                     NOT NULL,
  full_name  text,
  email      text                     NOT NULL,
  class_name text,
  phone      text,
  role       text                     DEFAULT 'user'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.asset_applications
  ADD CONSTRAINT asset_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ikes_applications
  ADD CONSTRAINT ikes_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));

GRANT ALL ON public.profiles TO anon;

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON public.profiles TO authenticated;

GRANT UPDATE (class_name, full_name, phone) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((((id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((((id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()))
  WITH CHECK ((((id = auth.uid()) AND public.is_allowed_user()) OR public.is_admin()));
