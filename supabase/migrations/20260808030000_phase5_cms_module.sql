-- HiPER Phase 5 Database Migration: Dynamic Content Management System (CMS) & Page Builder
-- Schema definitions for cms_pages and cms_page_blocks with Row Level Security (RLS) policies.

-- 1. Create cms_pages table
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bm text NOT NULL,
  title_en text,
  slug text UNIQUE NOT NULL,
  description_bm text,
  description_en text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public boolean NOT NULL DEFAULT true,
  show_in_navigation boolean NOT NULL DEFAULT false,
  navigation_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_nav ON public.cms_pages(show_in_navigation, navigation_order);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_cms_pages_updated_at ON public.cms_pages;
CREATE TRIGGER set_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Create cms_page_blocks table
CREATE TABLE IF NOT EXISTS public.cms_page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (block_type IN ('rich_text', 'image', 'button', 'link', 'gallery', 'spacer')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_page_blocks_page_id ON public.cms_page_blocks(page_id, display_order);

-- 3. Row Level Security Policies

-- cms_pages RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users view published cms pages" ON public.cms_pages;
CREATE POLICY "Public users view published cms pages" ON public.cms_pages
  FOR SELECT TO authenticated, anon
  USING ((status = 'published' AND is_public = true) OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage cms pages" ON public.cms_pages;
CREATE POLICY "Admins manage cms pages" ON public.cms_pages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;

-- cms_page_blocks RLS
ALTER TABLE public.cms_page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users view cms blocks of published pages" ON public.cms_page_blocks;
CREATE POLICY "Public users view cms blocks of published pages" ON public.cms_page_blocks
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_pages
      WHERE cms_pages.id = cms_page_blocks.page_id
        AND ((cms_pages.status = 'published' AND cms_pages.is_public = true) OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage cms page blocks" ON public.cms_page_blocks;
CREATE POLICY "Admins manage cms page blocks" ON public.cms_page_blocks
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.cms_page_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_page_blocks TO authenticated;

-- 4. Seed Default "Dasar Privasi" Page and Blocks
DO $$
DECLARE
  v_page_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cms_pages WHERE slug = 'dasar-privasi') THEN
    INSERT INTO public.cms_pages (
      title_bm,
      title_en,
      slug,
      description_bm,
      description_en,
      status,
      is_public,
      show_in_navigation,
      navigation_order
    ) VALUES (
      'Dasar Privasi',
      'Privacy Policy',
      'dasar-privasi',
      'Dasar privasi dan perlindungan data bagi Hab Perbendaharaan Digital (HiPER) JPP IPG Kampus Kota Bharu.',
      'Privacy policy and data protection for Digital Treasury Hub (HiPER) JPP IPG Kampus Kota Bharu.',
      'published',
      true,
      false,
      10
    )
    RETURNING id INTO v_page_id;

    -- Block 1: Pengenalan
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '1. Pengenalan',
        'heading_en', '1. Introduction',
        'body_bm', 'Hab Perbendaharaan Digital (HiPER) dikendalikan oleh Pejabat Bendahari Agung Kehormat JPP IPG Kampus Kota Bharu. Kami komited untuk melindungi privasi dan keselamatan maklumat peribadi siswa guru, staf dan pengguna portal ini. Dasar Privasi ini menjelaskan bagaimana maklumat dikumpul, digunakan, dan dilindungi.',
        'body_en', 'The Digital Treasury Hub (HiPER) is managed by the Office of the Honorary Treasurer General JPP IPG Kampus Kota Bharu. We are committed to protecting the privacy and security of personal information of student teachers, staff, and portal users. This Privacy Policy explains how information is collected, used, and protected.'
      ),
      1
    );

    -- Block 2: Pengumpulan Maklumat
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '2. Pengumpulan Maklumat',
        'heading_en', '2. Collection of Information',
        'body_bm', 'Kami mengumpul maklumat yang anda berikan secara langsung apabila membuat permohonan atau log masuk. Ini merangkumi: (a) Maklumat Akaun & Profil: Nama penuh, e-mel DELIMa, nombor telefon, unit/kumpulan; (b) Maklumat Permohonan: Butiran permohonan pinjaman e-Aset, bantuan kebajikan iKES, pinjaman KPK+, dan tempahan bilik; (c) Dokumen Sokongan: Resit, surat kelulusan, atau tiket yang dimuat naik.',
        'body_en', 'We collect information you directly provide when submitting applications or logging in. This includes: (a) Account & Profile Information: Full name, DELIMa email, phone number, unit/class; (b) Application Details: Loan requests for e-Asset, iKES welfare support, KPK+ loans, and room bookings; (c) Supporting Documents: Uploaded receipts, approval letters, or tickets.'
      ),
      2
    );

    -- Block 3: Penggunaan Maklumat
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '3. Penggunaan Maklumat',
        'heading_en', '3. Use of Information',
        'body_bm', 'Maklumat yang dikumpul digunakan khusus untuk: (a) Memproses dan mengesahkan permohonan e-Aset, iKES, KPK+, dan tempahan bilik JPP; (b) Menghantar notifikasi status permohonan melalui sistem dan e-mel; (c) Pengurusan pentadbiran, rekod audit kewangan, dan laporan rasmi PBAK; (d) Menjamin keselamatan dan integriti pengurusan harta serta dana perbendaharaan.',
        'body_en', 'Collected information is strictly used to: (a) Process and verify e-Asset requests, iKES, KPK+, and JPP room bookings; (b) Send application status notifications via the system and email; (c) Administrative management, financial audit records, and official PBAK reporting; (d) Ensure safety and integrity of property and treasury funds.'
      ),
      3
    );

    -- Block 4: Perlindungan Data
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '4. Perlindungan Data & Keselamatan',
        'heading_en', '4. Data Protection & Security',
        'body_bm', 'Kami melaksanakan kawalan keselamatan data berasaskan peranan (Role-Based Access Control) dan penyulitan SSL/TLS. Hanya pentadbir yang diberi kuasa mempunyai akses kepada dokumen sokongan dan rekod pemohon. Dokumen muat naik disimpan dalam balang storan tertutup yang dilindungi oleh dasar RLS Supabase.',
        'body_en', 'We enforce Role-Based Access Control (RBAC) and SSL/TLS encryption. Only authorized administrators have access to supporting documents and applicant records. Uploaded documents are stored in secure private storage buckets protected by Supabase RLS policies.'
      ),
      4
    );

    -- Block 5: Hak Pengguna
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '5. Hak Pengguna',
        'heading_en', '5. User Rights',
        'body_bm', 'Pengguna berhak untuk: (a) Menyemak dan mengemaskini maklumat profil pada bila-bila masa melalui Portal Permohonan Saya; (b) Meminta semakan atau pembetulan rekod permohonan daripada pentadbir; (c) Hubungi Pejabat Bendahari Agung Kehormat jika terdapat sebarang kemusykilan mengenai pengendalian data peribadi.',
        'body_en', 'Users have the right to: (a) Review and update profile information at any time via My Applications Portal; (b) Request verification or correction of application records from administrators; (c) Contact the Honorary Treasurer General Office regarding personal data concerns.'
      ),
      5
    );

    -- Block 6: Hubungan
    INSERT INTO public.cms_page_blocks (page_id, block_type, content, display_order)
    VALUES (
      v_page_id,
      'rich_text',
      jsonb_build_object(
        'heading_bm', '6. Hubungan & Pertanyaan',
        'heading_en', '6. Contact & Inquiries',
        'body_bm', 'Jika anda mempunyai sebarang soalan berkenaan Dasar Privasi ini, sila hubungi Pejabat Bendahari Agung Kehormat JPP IPG Kampus Kota Bharu melalui e-mel rasmi: jppipgkkb.rasmi@ipg.edu.my.',
        'body_en', 'If you have any questions regarding this Privacy Policy, please contact the Office of the Honorary Treasurer General JPP IPG Kampus Kota Bharu via official email: jppipgkkb.rasmi@ipg.edu.my.'
      ),
      6
    );

  END IF;
END $$;
