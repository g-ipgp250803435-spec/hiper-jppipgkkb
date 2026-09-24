-- HiPER Comprehensive Remediation Migration
-- Fixes HPR-01 through HPR-21 database-level security, RLS, privacy, and transaction constraints.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. HPR-01 & HPR-02: Room Booking Privacy and Self-Approval Protections
-- ---------------------------------------------------------------------------

-- Remove broad public calendar read policy
DROP POLICY IF EXISTS "Anyone can view room bookings for calendar" ON public.room_bookings;
DROP POLICY IF EXISTS "Users view own or admin views all room bookings" ON public.room_bookings;

CREATE POLICY "Users view own or admin views all room bookings" ON public.room_bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Secure RPC for anonymized public calendar availability query
CREATE OR REPLACE FUNCTION public.get_public_room_availability(
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT (CURRENT_DATE + 30)
)
RETURNS TABLE (
  id uuid,
  booking_date date,
  start_time text,
  end_time text,
  bureau text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    booking_date,
    start_time,
    end_time,
    bureau,
    status
  FROM public.room_bookings
  WHERE booking_date BETWEEN p_start_date AND p_end_date
    AND status IN ('pending', 'approved', 'completed')
  ORDER BY booking_date ASC, start_time ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_room_availability(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_room_availability(date, date) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. HPR-02 & HPR-10: Anti-Tampering & Immutable Cancellation Trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_user_application_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can update all fields and statuses
  IF public.is_admin() OR current_user IN ('postgres', 'supabase_admin') OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Non-admins must be the record owner
  IF OLD.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'You are not authorized to update this record.';
  END IF;

  -- Non-admins can only transition from pending to cancelled
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending applications can be updated.';
  END IF;

  IF NEW.status NOT IN ('pending', 'cancelled') THEN
    RAISE EXCEPTION 'Non-administrative users cannot change status to %.', NEW.status;
  END IF;

  -- Enforce field immutability on user updates
  IF TG_TABLE_NAME = 'room_bookings' THEN
    IF NEW.booking_date <> OLD.booking_date OR NEW.start_time <> OLD.start_time OR NEW.end_time <> OLD.end_time OR
       NEW.name <> OLD.name OR NEW.bureau <> OLD.bureau OR NEW.purpose <> OLD.purpose OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'Application fields cannot be altered during status update.';
    END IF;
  ELSIF TG_TABLE_NAME = 'asset_applications' THEN
    IF NEW.asset_id <> OLD.asset_id OR NEW.quantity <> OLD.quantity OR NEW.borrow_date <> OLD.borrow_date OR
       NEW.return_date <> OLD.return_date OR NEW.purpose <> OLD.purpose OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'Application fields cannot be altered during status update.';
    END IF;
  ELSIF TG_TABLE_NAME = 'ikes_applications' THEN
    IF NEW.ikes_type <> OLD.ikes_type OR NEW.amount <> OLD.amount OR NEW.reason <> OLD.reason OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'Application fields cannot be altered during status update.';
    END IF;
  ELSIF TG_TABLE_NAME = 'donations' THEN
    IF NEW.amount <> OLD.amount OR NEW.payment_method <> OLD.payment_method OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'Application fields cannot be altered during status update.';
    END IF;
  ELSIF TG_TABLE_NAME = 'kpk_applications' THEN
    IF NEW.amount <> OLD.amount OR NEW.bureau <> OLD.bureau OR NEW.purpose <> OLD.purpose OR NEW.user_id <> OLD.user_id THEN
      RAISE EXCEPTION 'Application fields cannot be altered during status update.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_tampering_room_bookings ON public.room_bookings;
CREATE TRIGGER prevent_tampering_room_bookings
  BEFORE UPDATE ON public.room_bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_application_tampering();

DROP TRIGGER IF EXISTS prevent_tampering_asset_applications ON public.asset_applications;
CREATE TRIGGER prevent_tampering_asset_applications
  BEFORE UPDATE ON public.asset_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_application_tampering();

DROP TRIGGER IF EXISTS prevent_tampering_ikes_applications ON public.ikes_applications;
CREATE TRIGGER prevent_tampering_ikes_applications
  BEFORE UPDATE ON public.ikes_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_application_tampering();

DROP TRIGGER IF EXISTS prevent_tampering_donations ON public.donations;
CREATE TRIGGER prevent_tampering_donations
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_application_tampering();

DROP TRIGGER IF EXISTS prevent_tampering_kpk_applications ON public.kpk_applications;
CREATE TRIGGER prevent_tampering_kpk_applications
  BEFORE UPDATE ON public.kpk_applications
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_application_tampering();

-- ---------------------------------------------------------------------------
-- 3. HPR-04: Administrative Notification Privacy
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view own or admin notifications" ON public.notifications;

CREATE POLICY "Users view own or admin notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND public.is_admin()) OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. HPR-07: Atomic Room Booking Conflict Prevention & Approval RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_room_booking(
  p_booking_date date,
  p_start_time text,
  p_end_time text,
  p_name text,
  p_bureau text,
  p_purpose text,
  p_remarks text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_overlap_count integer;
  v_new_id uuid;
  v_new_record jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sila log masuk terlebih dahulu.');
  END IF;

  IF p_booking_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak boleh membuat tempahan pada tarikh yang telah lalu.');
  END IF;

  IF p_start_time >= p_end_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'Masa tamat mesti selepas masa mula.');
  END IF;

  -- Lock existing bookings for this date to prevent concurrent reservation races
  PERFORM id FROM public.room_bookings
  WHERE booking_date = p_booking_date
    AND status IN ('pending', 'approved')
  FOR UPDATE;

  -- Check for time slot overlap
  SELECT count(*) INTO v_overlap_count
  FROM public.room_bookings
  WHERE booking_date = p_booking_date
    AND status IN ('pending', 'approved')
    AND NOT (p_end_time <= start_time OR p_start_time >= end_time);

  IF v_overlap_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maaf, Bilik JPP telah ditempah pada masa/tarikh tersebut. Sila pilih masa lain.');
  END IF;

  INSERT INTO public.room_bookings (
    user_id, booking_date, start_time, end_time, name, bureau, purpose, remarks, status
  ) VALUES (
    v_user_id, p_booking_date, p_start_time, p_end_time, trim(p_name), trim(p_bureau), trim(p_purpose), nullif(trim(p_remarks), ''), 'pending'
  ) RETURNING id INTO v_new_id;

  SELECT row_to_json(r)::jsonb INTO v_new_record FROM public.room_bookings r WHERE id = v_new_id;

  RETURN jsonb_build_object('success', true, 'data', v_new_record);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_room_booking(date, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_room_booking(date, text, text, text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.approve_room_booking(
  p_booking_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.room_bookings%ROWTYPE;
  v_overlap_count integer;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hanya pentadbir dibenarkan meluluskan tempahan.');
  END IF;

  SELECT * INTO v_booking FROM public.room_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rekod tempahan tidak ditemui.');
  END IF;

  SELECT count(*) INTO v_overlap_count
  FROM public.room_bookings
  WHERE booking_date = v_booking.booking_date
    AND id <> p_booking_id
    AND status = 'approved'
    AND NOT (v_booking.end_time <= start_time OR v_booking.start_time >= end_time);

  IF v_overlap_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gagal meluluskan: Terdapat tempahan lain yang telah diluluskan pada slot masa yang sama.');
  END IF;

  UPDATE public.room_bookings
  SET status = 'approved', updated_at = now()
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_room_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_room_booking(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. HPR-08: Donation Cancellation Constraint Upgrade
-- ---------------------------------------------------------------------------

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE public.donations ADD CONSTRAINT donations_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'cancelled'::text]));

-- ---------------------------------------------------------------------------
-- 6. HPR-09: Notification Delivery Log Table Source Expansion
-- ---------------------------------------------------------------------------

ALTER TABLE public.notification_delivery_log DROP CONSTRAINT IF EXISTS notification_delivery_log_source_table_check;
ALTER TABLE public.notification_delivery_log ADD CONSTRAINT notification_delivery_log_source_table_check
  CHECK (source_table IN ('ikes_applications', 'asset_applications', 'donations', 'kpk_applications', 'room_bookings'));

-- ---------------------------------------------------------------------------
-- 7. HPR-11: Transactional CMS Block Saving RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.save_cms_page_blocks_transactional(
  p_page_id uuid,
  p_blocks jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya pentadbir dibenarkan mengemas kini blok CMS.';
  END IF;

  -- Delete existing blocks for the target page
  DELETE FROM public.cms_page_blocks WHERE page_id = p_page_id;

  -- Insert new blocks in atomic sequence
  IF p_blocks IS NOT NULL AND jsonb_array_length(p_blocks) > 0 THEN
    INSERT INTO public.cms_page_blocks (
      page_id, block_type, content, display_order
    )
    SELECT
      p_page_id,
      (b->>'block_type'),
      (b->'content'),
      COALESCE((b->>'display_order')::integer, 1)
    FROM jsonb_array_elements(p_blocks) AS b;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_cms_page_blocks_transactional(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_cms_page_blocks_transactional(uuid, jsonb) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. HPR-14: Financial Accountability Audit Logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  amount numeric(12, 2),
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.financial_audit_logs TO authenticated;
GRANT ALL ON public.financial_audit_logs TO service_role;

DROP POLICY IF EXISTS "Admins read financial audit logs" ON public.financial_audit_logs;
CREATE POLICY "Admins read financial audit logs" ON public.financial_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. HPR-19: Concurrent iKES Application Number Generator Sequence
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.ikes_app_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_ikes_application_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text;
  seq_num bigint;
BEGIN
  IF NEW.application_number IS NULL OR trim(NEW.application_number) = '' THEN
    prefix := 'IK-' || EXTRACT(YEAR FROM now())::text || '-';
    seq_num := nextval('public.ikes_app_number_seq');
    NEW.application_number := prefix || LPAD(seq_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
