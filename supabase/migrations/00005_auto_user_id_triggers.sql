-- Auto-set user_id from auth context on insert for all user-scoped tables
-- This fixes the bug where client-side inserts omit user_id

CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_session_sets(
  p_session_id uuid,
  p_sets jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM sets
  WHERE session_exercise_id IN (
    SELECT id FROM session_exercises WHERE session_id = p_session_id
  );

  INSERT INTO sets (session_exercise_id, set_number, weight_kg, reps)
  SELECT
    (s->>'session_exercise_id')::uuid,
    (s->>'set_number')::int,
    (s->>'weight_kg')::numeric,
    (s->>'reps')::int
  FROM jsonb_array_elements(p_sets) AS s;
END;
$$;

-- Apply trigger to all user-scoped tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['habits', 'habit_logs', 'exercises', 'workout_days', 'workout_sessions', 'body_weight_logs'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_user_id ON %I;
       CREATE TRIGGER trg_set_user_id
       BEFORE INSERT ON %I
       FOR EACH ROW
       EXECUTE FUNCTION set_user_id();',
      tbl, tbl
    );
  END LOOP;
END;
$$;