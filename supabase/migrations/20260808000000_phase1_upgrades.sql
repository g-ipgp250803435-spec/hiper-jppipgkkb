-- HiPER Phase 1 Database Migration: Core Refinements & Quick-Win Upgrades
-- Idempotent schema upgrades for Announcements priority, e-Aset enhancements, Organization hierarchy, and Notifications foundation.

-- 1. Announcements Table Upgrades
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS pin_type text DEFAULT 'none' CHECK (pin_type IN ('none', 'penting', 'terkini')),
  ADD COLUMN IF NOT EXISTS expiry_at timestamptz;

-- Backfill pin_type based on existing boolean pinned field
UPDATE public.announcements
SET pin_type = 'penting'
WHERE pinned = true AND (pin_type IS NULL OR pin_type = 'none');

-- 2. Asset Applications Table Upgrades
ALTER TABLE public.asset_applications
  ADD COLUMN IF NOT EXISTS department_unit text,
  ADD COLUMN IF NOT EXISTS aku_janji_agreed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS aku_janji_agreed_at timestamptz;

-- Backfill department_unit from existing class_name if null
UPDATE public.asset_applications
SET department_unit = class_name
WHERE department_unit IS NULL;

-- 3. Organization Members Table Upgrades
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS node_category text,
  ADD COLUMN IF NOT EXISTS description text;

-- 4. Notifications Table Foundation
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('e_aset', 'ikes', 'tabung_jumaat', 'kpk', 'tempahan', 'announcement')),
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Security for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR recipient_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin())
  WITH CHECK (recipient_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
