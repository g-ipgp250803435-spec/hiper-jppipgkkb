-- HiPER notification reliability hardening.
-- 1) Allow application pages to create admin-only notifications through a
--    constrained SECURITY DEFINER function instead of a broad INSERT policy.
-- 2) Extend the notification type constraint for CMS publication notices.
BEGIN;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'e_aset', 'ikes', 'tabung_jumaat', 'kpk', 'tempahan', 'announcement', 'cms_page'
  ));

CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_title text,
  p_message text,
  p_notification_type text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR (NOT public.is_allowed_user() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Not authorized to create a notification.';
  END IF;

  IF p_notification_type NOT IN ('e_aset', 'ikes', 'tabung_jumaat', 'kpk', 'tempahan', 'announcement') THEN
    RAISE EXCEPTION 'Unsupported admin notification type.';
  END IF;

  IF length(trim(coalesce(p_title, ''))) = 0 OR length(p_title) > 160 THEN
    RAISE EXCEPTION 'Invalid notification title.';
  END IF;

  IF length(trim(coalesce(p_message, ''))) = 0 OR length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Invalid notification message.';
  END IF;

  INSERT INTO public.notifications (
    recipient_id, title, message, notification_type, reference_id, is_read
  ) VALUES (
    NULL, trim(p_title), trim(p_message), p_notification_type, p_reference_id, false
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_notification(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_notification(text, text, text, uuid) TO authenticated;

COMMIT;
