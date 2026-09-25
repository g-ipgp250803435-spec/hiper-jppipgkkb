-- Migration: Disable direct INSERT on room_bookings for ordinary authenticated users
-- Forces all room booking submissions to go through the create_room_booking() SECURITY DEFINER RPC.

BEGIN;

-- Drop direct insert policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users insert own room bookings" ON public.room_bookings;

COMMIT;
