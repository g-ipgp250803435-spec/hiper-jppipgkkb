BEGIN;

-- HiPER V3.1.1 iKES activation

CREATE OR REPLACE FUNCTION public.generate_ikes_application_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
 prefix text;
 counter integer;
BEGIN
 IF NEW.application_number IS NULL THEN
   prefix := 'IK-' || EXTRACT(YEAR FROM now())::text || '-';
   SELECT COUNT(*) + 1 INTO counter FROM public.ikes_applications;
   NEW.application_number := prefix || LPAD(counter::text,4,'0');
 END IF;
 RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_ikes_number ON public.ikes_applications;
CREATE TRIGGER trigger_generate_ikes_number
BEFORE INSERT ON public.ikes_applications
FOR EACH ROW EXECUTE FUNCTION public.generate_ikes_application_number();

COMMIT;
