-- Phase 9: Admin-controlled Announcement Date
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS announcement_date timestamptz DEFAULT now();

UPDATE public.announcements
  SET announcement_date = created_at
  WHERE announcement_date IS NULL;
