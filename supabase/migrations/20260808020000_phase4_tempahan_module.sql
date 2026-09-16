-- HiPER Phase 4 Database Migration: Tempahan Management & Tempahan Bilik JPP Booking System
-- Schema definitions for booking_services and room_bookings with complete RLS policies.

-- 1. Create Booking Services Table
CREATE TABLE IF NOT EXISTS public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bm text NOT NULL,
  title_en text,
  description_bm text,
  description_en text,
  image_url text,
  booking_type text NOT NULL DEFAULT 'custom',
  active boolean NOT NULL DEFAULT true,
  instructions_bm text,
  instructions_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial booking services
INSERT INTO public.booking_services (title_bm, title_en, description_bm, description_en, booking_type, active)
SELECT title_bm, title_en, description_bm, description_en, booking_type, active
FROM (VALUES
  (
    'Tempahan Baju Rasmi',
    'Official Apparel Order',
    'Tempahan baju korporat, t-shirt rasmi dan pakaian perwakilan JPP IPGKKB.',
    'Official corporate shirts, t-shirts, and apparel orders for JPP IPGKKB.',
    'apparel',
    true
  ),
  (
    'Tempahan Tanda Nama',
    'Name Tag Order',
    'Tempahan tanda nama rasmi berlogo IPGKKB untuk siswa guru dan ahli JPP.',
    'Official IPGKKB logo name tag orders for student teachers and JPP members.',
    'nametag',
    true
  ),
  (
    'Tempahan Bilik JPP',
    'JPP Room Booking',
    'Sistem tempahan dan kalendar ketersediaan Bilik Mesyuarat / Perbincangan JPP.',
    'Booking system and availability calendar for JPP Meeting / Discussion Room.',
    'room_booking',
    true
  )
) AS v(title_bm, title_en, description_bm, description_en, booking_type, active)
WHERE NOT EXISTS (SELECT 1 FROM public.booking_services LIMIT 1);

-- 2. Create Room Bookings Table
CREATE TABLE IF NOT EXISTS public.room_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  name text NOT NULL,
  bureau text NOT NULL,
  purpose text NOT NULL,
  remarks text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast query and calendar filtering
CREATE INDEX IF NOT EXISTS idx_room_bookings_user_id ON public.room_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_date ON public.room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON public.room_bookings(status);

-- 3. Row Level Security Policies

-- RLS for booking_services
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active booking services" ON public.booking_services;
CREATE POLICY "Anyone can view active booking services" ON public.booking_services
  FOR SELECT TO authenticated, anon
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage booking services" ON public.booking_services;
CREATE POLICY "Admins manage booking services" ON public.booking_services
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.booking_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_services TO authenticated;

-- RLS for room_bookings
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view room bookings for calendar" ON public.room_bookings;
CREATE POLICY "Anyone can view room bookings for calendar" ON public.room_bookings
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users insert own room bookings" ON public.room_bookings;
CREATE POLICY "Authenticated users insert own room bookings" ON public.room_bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users or admins update room bookings" ON public.room_bookings;
CREATE POLICY "Users or admins update room bookings" ON public.room_bookings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins delete room bookings" ON public.room_bookings;
CREATE POLICY "Admins delete room bookings" ON public.room_bookings
  FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.room_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_bookings TO authenticated;
