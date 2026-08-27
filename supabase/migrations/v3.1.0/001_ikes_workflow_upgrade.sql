
-- HiPER V3.1.0 iKES Professional Workflow Upgrade
-- Compatible with existing HiPER V2 schema
-- Run in Supabase SQL Editor

BEGIN;

ALTER TABLE public.ikes_applications
ADD COLUMN IF NOT EXISTS application_number text UNIQUE,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_ikes_application_number
ON public.ikes_applications(application_number);

CREATE INDEX IF NOT EXISTS idx_ikes_status
ON public.ikes_applications(status);

COMMIT;
