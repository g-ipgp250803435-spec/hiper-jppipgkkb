-- HiPER Phase 2 Database Migration: KPK+ Module & Application Notification Workflow
-- Schema definitions for kpk_bureaus and kpk_applications with complete RLS policies.

-- 1. Create KPK Bureaus Table
CREATE TABLE IF NOT EXISTS public.kpk_bureaus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial bureaus if not already present
INSERT INTO public.kpk_bureaus (name, display_order, active)
SELECT name, display_order, true
FROM (VALUES
  ('Biro Akademik', 1),
  ('Biro Kerohanian', 2),
  ('Biro Kebajikan', 3),
  ('Biro Sukan', 4),
  ('Biro Multimedia', 5),
  ('Biro Protokol', 6),
  ('Biro Keusahawanan', 7),
  ('Biro Kebudayaan', 8),
  ('Biro Pengantarabangsaan', 9),
  ('Biro Khas', 10)
) AS v(name, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.kpk_bureaus LIMIT 1);

-- 2. Create KPK Applications Table
CREATE TABLE IF NOT EXISTS public.kpk_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_name text NOT NULL,
  applicant_name text NOT NULL,
  phone text NOT NULL,
  department_unit text NOT NULL,
  bureau_id uuid REFERENCES public.kpk_bureaus(id) ON DELETE SET NULL,
  loan_amount numeric NOT NULL CHECK (loan_amount > 0),
  purpose text NOT NULL,
  supporting_document_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user and status filtering
CREATE INDEX IF NOT EXISTS idx_kpk_applications_user_id ON public.kpk_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_kpk_applications_status ON public.kpk_applications(status);

-- 3. Row Level Security Policies

-- RLS for kpk_bureaus
ALTER TABLE public.kpk_bureaus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active kpk bureaus" ON public.kpk_bureaus;
CREATE POLICY "Anyone can view active kpk bureaus" ON public.kpk_bureaus
  FOR SELECT TO authenticated, anon
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage kpk bureaus" ON public.kpk_bureaus;
CREATE POLICY "Admins manage kpk bureaus" ON public.kpk_bureaus
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.kpk_bureaus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpk_bureaus TO authenticated;

-- RLS for kpk_applications
ALTER TABLE public.kpk_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own kpk applications" ON public.kpk_applications;
CREATE POLICY "Users view own kpk applications" ON public.kpk_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own kpk applications" ON public.kpk_applications;
CREATE POLICY "Users insert own kpk applications" ON public.kpk_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage kpk applications" ON public.kpk_applications;
CREATE POLICY "Admins manage kpk applications" ON public.kpk_applications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpk_applications TO authenticated;
