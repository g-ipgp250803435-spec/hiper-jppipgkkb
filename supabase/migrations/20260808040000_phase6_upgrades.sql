-- HiPER Phase 6 Database Migration: Booking Services External Link & Hierarchy Upgrades
-- Adds external_link text column to public.booking_services for external Google Forms booking links.

ALTER TABLE public.booking_services
ADD COLUMN IF NOT EXISTS external_link text;

-- Update existing default booking services with example external link structure if appropriate
COMMENT ON COLUMN public.booking_services.external_link IS 'Optional external URL (e.g. Google Form) for third-party bookings';
