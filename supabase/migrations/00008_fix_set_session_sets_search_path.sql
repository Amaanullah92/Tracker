-- Fix set_session_sets search_path: '' -> 'public'
-- Same class of bug as 00007: unqualified table refs (sets, session_exercises)
-- fail with empty search_path.

CREATE OR REPLACE FUNCTION set_session_sets(
  p_session_id uuid,
  p_sets jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
