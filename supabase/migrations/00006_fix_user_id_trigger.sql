-- Fix set_user_id trigger: only set user_id if not already provided
-- This preserves explicit user_id values (e.g., from service_role cron inserts)

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;