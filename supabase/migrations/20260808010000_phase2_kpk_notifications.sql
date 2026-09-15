-- HiPER Phase 2 Database Migration: KPK+ Loan Application Module & Complete Notification System
-- Creates dynamic kpk_bureaus, kpk_applications table, RLS policies, and triggers.

-- 1. Create KPK Bureaus Table
CREATE TABLE IF NOT EXISTS public.kpk_bureaus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Default 10 Bureaus
INSERT INTO public.kpk_bureaus (name, display_order, active)
VALUES
  ('Biro Akademik', 1, true),
  ('Biro Kerohanian', 2, true),
  ('Biro Kebajikan', 3, true),
  ('Biro Sukan', 4, true),
  ('Biro Multimedia', 5, true),
  ('Biro Protokol', 6, true),
  ('Biro Keusahawanan', 7, true),
  ('Biro Kebudayaan', 8, true),
  ('Biro Pengantarabangsaan', 9, true),
  ('Biro Khas', 10, true)
ON CONFLICT DO NOTHING;

-- 2. Create KPK Applications Table
CREATE TABLE IF NOT EXISTS public.kpk_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_name text NOT NULL,
  applicant_name text NOT NULL,
  phone text NOT NULL,
  department_unit text NOT NULL,
  bureau_id uuid REFERENCES public.kpk_bureaus(id) ON DELETE SET NULL,
  bureau_name text,
  loan_amount numeric(10,2) NOT NULL CHECK (loan_amount IN (500, 800, 1000)),
  purpose text NOT NULL,
  supporting_document_path text,
  aku_janji_agreed boolean NOT NULL DEFAULT true,
  aku_janji_agreed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated-at triggers for Phase 2 tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_kpk_bureaus') THEN
    CREATE TRIGGER set_updated_at_kpk_bureaus BEFORE UPDATE ON public.kpk_bureaus FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_kpk_apps') THEN
    CREATE TRIGGER set_updated_at_kpk_apps BEFORE UPDATE ON public.kpk_applications FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;

-- 3. Row Level Security Policies for kpk_bureaus
ALTER TABLE public.kpk_bureaus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active bureaus" ON public.kpk_bureaus;
CREATE POLICY "Public read active bureaus" ON public.kpk_bureaus
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage bureaus" ON public.kpk_bureaus;
CREATE POLICY "Admins manage bureaus" ON public.kpk_bureaus
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Row Level Security Policies for kpk_applications
ALTER TABLE public.kpk_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users submit KPK applications" ON public.kpk_applications;
CREATE POLICY "Users submit KPK applications" ON public.kpk_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_allowed_user());

DROP POLICY IF EXISTS "Users view own KPK applications" ON public.kpk_applications;
CREATE POLICY "Users view own KPK applications" ON public.kpk_applications
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND public.is_allowed_user()) OR public.is_admin());

DROP POLICY IF EXISTS "Admins update KPK applications" ON public.kpk_applications;
CREATE POLICY "Admins update KPK applications" ON public.kpk_applications
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete KPK applications" ON public.kpk_applications;
CREATE POLICY "Admins delete KPK applications" ON public.kpk_applications
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Privileges
GRANT SELECT ON public.kpk_bureaus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpk_bureaus, public.kpk_applications TO authenticated;
