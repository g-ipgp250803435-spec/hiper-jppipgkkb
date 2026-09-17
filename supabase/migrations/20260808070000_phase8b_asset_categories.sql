-- HiPER Phase 8B Database Migration: Asset Categories Management Table
-- Introduces public.asset_categories table, security policies, and initial default categories.

CREATE TABLE IF NOT EXISTS public.asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bm text NOT NULL,
  name_en text,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Security for Asset Categories
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read asset categories" ON public.asset_categories;
CREATE POLICY "Public read asset categories" ON public.asset_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage asset categories" ON public.asset_categories;
CREATE POLICY "Admins manage asset categories" ON public.asset_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.asset_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_categories TO authenticated;

-- Updated-at trigger
DROP TRIGGER IF EXISTS set_updated_at_trigger ON public.asset_categories;
CREATE TRIGGER set_updated_at_trigger
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Seed initial default asset categories if table is empty
INSERT INTO public.asset_categories (name_bm, name_en, display_order)
SELECT 'Elektronik', 'Electronics', 1
WHERE NOT EXISTS (SELECT 1 FROM public.asset_categories WHERE lower(name_bm) = 'elektronik');

INSERT INTO public.asset_categories (name_bm, name_en, display_order)
SELECT 'Peralatan Program', 'Program Equipment', 2
WHERE NOT EXISTS (SELECT 1 FROM public.asset_categories WHERE lower(name_bm) = 'peralatan program');

INSERT INTO public.asset_categories (name_bm, name_en, display_order)
SELECT 'Perabot', 'Furniture', 3
WHERE NOT EXISTS (SELECT 1 FROM public.asset_categories WHERE lower(name_bm) = 'perabot');

INSERT INTO public.asset_categories (name_bm, name_en, display_order)
SELECT 'Audio Visual', 'Audio Visual', 4
WHERE NOT EXISTS (SELECT 1 FROM public.asset_categories WHERE lower(name_bm) = 'audio visual');

INSERT INTO public.asset_categories (name_bm, name_en, display_order)
SELECT 'Lain-lain', 'Others', 5
WHERE NOT EXISTS (SELECT 1 FROM public.asset_categories WHERE lower(name_bm) = 'lain-lain');
