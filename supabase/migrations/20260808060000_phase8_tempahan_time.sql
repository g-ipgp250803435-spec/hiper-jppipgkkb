-- HiPER Migration: Add booking duration start_time and end_time to room_bookings
ALTER TABLE public.room_bookings
ADD COLUMN IF NOT EXISTS start_time text,
ADD COLUMN IF NOT EXISTS end_time text;
