-- Replace the seed function with completion_field/completion_value
CREATE OR REPLACE FUNCTION seed_defaults_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM habits WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  -- 1. Namaz (special completion logic: all 5 prayers "Prayed")
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Namaz', '5 daily prayers — Fajr, Zuhr, Asr, Maghrib, Isha',
      '[
        {"key": "status", "label": "Status", "type": "select", "options": ["Prayed", "Not Prayed"]},
        {"key": "jamat", "label": "With Jamat?", "type": "toggle"},
        {"key": "completeness", "label": "Completeness", "type": "select", "options": ["Full", "Partial", "Farz Only"]}
      ]'::jsonb,
      'status', 'Prayed',
      'positive', 1, true);

  -- 2. Quran Tilawat
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Quran Tilawat', 'Daily Quran reading',
      '[{"key": "done", "label": "Done?", "type": "toggle"}]'::jsonb,
      'done', NULL,
      'positive', 2, true);

  -- 3. Sleep (any logged values = done)
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Sleep', 'Track sleep hours and times',
      '[{"key": "hours", "label": "Hours", "type": "number", "min": 0, "max": 24}, {"key": "bed_time", "label": "Bed Time", "type": "time"}, {"key": "wake_time", "label": "Wake Time", "type": "time"}]'::jsonb,
      NULL, NULL,
      'positive', 3, true);

  -- 4. Brushing Teeth
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Brushing Teeth', 'Track brushing',
      '[{"key": "done", "label": "Done?", "type": "toggle"}, {"key": "times", "label": "Times", "type": "select", "options": ["1", "2"]}]'::jsonb,
      'done', NULL,
      'positive', 4, true);

  -- 5. Personal Project/Skill Work
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Personal Project', 'Work on personal projects or skills',
      '[{"key": "done", "label": "Done?", "type": "toggle"}, {"key": "note", "label": "What did you work on?", "type": "text"}]'::jsonb,
      'done', NULL,
      'positive', 5, true);

  -- 6. Gym
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Gym', 'Went to the gym today?',
      '[{"key": "went", "label": "Went?", "type": "toggle"}]'::jsonb,
      'went', NULL,
      'positive', 6, true);

  -- 7. Shake
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Shake', 'Track protein shake consumption',
      '[{"key": "drank", "label": "Drank?", "type": "toggle"}, {"key": "flavor", "label": "Flavor", "type": "select", "options": ["Mango", "Banana+Dates"]}]'::jsonb,
      'drank', NULL,
      'positive', 7, true);

  -- 8. Eggs
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Eggs', 'Track egg consumption',
      '[{"key": "ate", "label": "Ate?", "type": "toggle"}, {"key": "quantity", "label": "Quantity", "type": "number", "min": 0, "max": 20}]'::jsonb,
      'ate', NULL,
      'positive', 8, true);

  -- 9. Money (any logged values = done, even $0)
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Money', 'Track daily spending and earnings',
      '[{"key": "spent", "label": "Spent (PKR)", "type": "number", "min": 0}, {"key": "earned", "label": "Earned (PKR)", "type": "number", "min": 0}]'::jsonb,
      NULL, NULL,
      'positive', 9, true);

  -- 10. Fap (inverse streak)
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Fap', 'Track abstinence streak (inverse: done = streak break)',
      '[{"key": "did", "label": "Did?", "type": "toggle"}]'::jsonb,
      'did', NULL,
      'inverse', 10, true);

  -- 11. Watching P (inverse streak)
  INSERT INTO habits (user_id, name, description, field_schema, completion_field, completion_value, streak_direction, sort_order, is_active)
  VALUES
    (p_user_id, 'Watching P', 'Track abstinence streak (inverse: done = streak break)',
      '[{"key": "did", "label": "Did?", "type": "toggle"}]'::jsonb,
      'did', NULL,
      'inverse', 11, true);

  -- Seed exercise library
  INSERT INTO exercises (user_id, name, muscle_group, default_rest_seconds, is_active)
  VALUES
    (p_user_id, 'Incline Dumbbell Press', 'Chest', 90, true),
    (p_user_id, 'Straight Bench Press', 'Chest', 90, true),
    (p_user_id, 'High-to-Low Cable Fly', 'Chest', 60, true),
    (p_user_id, 'Cable Lateral Raises', 'Shoulders', 60, true),
    (p_user_id, 'Inclined Dumbbell Bicep Curls', 'Arms', 60, true),
    (p_user_id, 'Rope Hammer Curls', 'Arms', 60, true),
    (p_user_id, 'Front Forearm Machine', 'Arms', 60, true),
    (p_user_id, 'Cable Wrist Flexors', 'Arms', 60, true),
    (p_user_id, 'Machine Bent Over Row', 'Back', 90, true),
    (p_user_id, 'Machine Lat Pulldown', 'Back', 90, true),
    (p_user_id, 'Machine Seated Row', 'Back', 90, true),
    (p_user_id, 'Hyperextension', 'Back', 60, true),
    (p_user_id, 'Skullcrushers', 'Arms', 60, true),
    (p_user_id, 'Tricep Pushdown', 'Arms', 60, true),
    (p_user_id, 'Reverse-Grip Tricep Pushdown', 'Arms', 60, true),
    (p_user_id, 'Dumbbell Lateral Raises', 'Shoulders', 60, true),
    (p_user_id, 'Smith Machine Shoulder Press', 'Shoulders', 90, true),
    (p_user_id, 'Reverse Peck Deck', 'Shoulders', 60, true),
    (p_user_id, 'Dumbbell Shrugs', 'Back', 60, true),
    (p_user_id, 'Reverse Hamstring Curls', 'Legs', 90, true),
    (p_user_id, 'Quad Extension', 'Legs', 90, true),
    (p_user_id, 'Calf Raises', 'Legs', 60, true),
    (p_user_id, 'Inclined Smith Machine Press', 'Chest', 90, true),
    (p_user_id, 'Seated Machine Press', 'Chest', 90, true),
    (p_user_id, 'Inclined Chest Fly Machine', 'Chest', 60, true),
    (p_user_id, 'Curl Bar Bicep Curls', 'Arms', 60, true),
    (p_user_id, 'Dumbbell Hammer Curls', 'Arms', 60, true),
    (p_user_id, 'T-Bar Row', 'Back', 90, true),
    (p_user_id, 'Lat Pulldown', 'Back', 90, true),
    (p_user_id, 'Seated Row Machine', 'Back', 90, true),
    (p_user_id, 'Shrugs', 'Back', 60, true),
    (p_user_id, 'Hack Squat Machine', 'Legs', 120, true),
    (p_user_id, 'Leg Press', 'Legs', 120, true);

  -- Push Day 1
  WITH pd1 AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Push Day 1', 0, 1)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT pd1.id, e.id, row_number() OVER ()
  FROM pd1, LATERAL (
    SELECT e.id FROM exercises e
    WHERE e.user_id = p_user_id AND e.name IN (
      'Incline Dumbbell Press', 'Straight Bench Press', 'High-to-Low Cable Fly',
      'Cable Lateral Raises', 'Inclined Dumbbell Bicep Curls',
      'Rope Hammer Curls', 'Front Forearm Machine', 'Cable Wrist Flexors'
    )
    ORDER BY array_position(
      ARRAY['Incline Dumbbell Press', 'Straight Bench Press', 'High-to-Low Cable Fly',
        'Cable Lateral Raises', 'Inclined Dumbbell Bicep Curls',
        'Rope Hammer Curls', 'Front Forearm Machine', 'Cable Wrist Flexors'],
      e.name
    )
  ) e;

  -- Pull Day 1
  WITH pd1 AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Pull Day 1', 1, 2)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT pd1.id, e.id, row_number() OVER ()
  FROM pd1, LATERAL (
    SELECT id FROM exercises WHERE user_id = p_user_id AND name IN (
      'Machine Bent Over Row', 'Machine Lat Pulldown', 'Machine Seated Row',
      'Hyperextension', 'Skullcrushers', 'Tricep Pushdown', 'Reverse-Grip Tricep Pushdown'
    )
    ORDER BY array_position(
      ARRAY['Machine Bent Over Row', 'Machine Lat Pulldown', 'Machine Seated Row',
        'Hyperextension', 'Skullcrushers', 'Tricep Pushdown', 'Reverse-Grip Tricep Pushdown'],
      name
    )
  ) e;

  UPDATE workout_day_exercises wde
  SET superset_group_id = 'tricep_superset'
  FROM exercises e
  WHERE wde.exercise_id = e.id
    AND e.name IN ('Tricep Pushdown', 'Reverse-Grip Tricep Pushdown')
    AND wde.workout_day_id IN (SELECT id FROM workout_days WHERE user_id = p_user_id AND name = 'Pull Day 1');

  -- Shoulder + Legs
  WITH sl AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Shoulder + Legs', 2, 3)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT sl.id, e.id, row_number() OVER()
  FROM sl, LATERAL (
    SELECT id FROM exercises WHERE user_id = p_user_id AND name IN (
      'Dumbbell Lateral Raises', 'Smith Machine Shoulder Press',
      'Reverse Peck Deck', 'Dumbbell Shrugs',
      'Reverse Hamstring Curls', 'Quad Extension', 'Calf Raises'
    )
    ORDER BY array_position(
      ARRAY['Dumbbell Lateral Raises', 'Smith Machine Shoulder Press',
        'Reverse Peck Deck', 'Dumbbell Shrugs',
        'Reverse Hamstring Curls', 'Quad Extension', 'Calf Raises'],
      name
    )
  ) e;

  -- Push Day 2
  WITH pd2 AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Push Day 2', 3, 4)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT pd2.id, e.id, row_number() OVER()
  FROM pd2, LATERAL (
    SELECT id FROM exercises WHERE user_id = p_user_id AND name IN (
      'Inclined Smith Machine Press', 'Seated Machine Press',
      'Inclined Chest Fly Machine', 'Curl Bar Bicep Curls',
      'Dumbbell Hammer Curls', 'Front Forearm Machine', 'Cable Wrist Flexors'
    )
    ORDER BY array_position(
      ARRAY['Inclined Smith Machine Press', 'Seated Machine Press',
        'Inclined Chest Fly Machine', 'Curl Bar Bicep Curls',
        'Dumbbell Hammer Curls', 'Front Forearm Machine', 'Cable Wrist Flexors'],
      name
    )
  ) e;

  -- Pull Day 2
  WITH pd2 AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Pull Day 2', 4, 5)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT pd2.id, e.id, row_number() OVER()
  FROM pd2, LATERAL (
    SELECT id FROM exercises WHERE user_id = p_user_id AND name IN (
      'T-Bar Row', 'Lat Pulldown', 'Seated Row Machine',
      'Reverse Peck Deck', 'Shrugs', 'Skullcrushers', 'Tricep Pushdown'
    )
    ORDER BY array_position(
      ARRAY['T-Bar Row', 'Lat Pulldown', 'Seated Row Machine',
        'Reverse Peck Deck', 'Shrugs', 'Skullcrushers', 'Tricep Pushdown'],
      name
    )
  ) e;

  -- Legs
  WITH l AS (
    INSERT INTO workout_days (user_id, name, scheduled_weekday, sort_order)
    VALUES (p_user_id, 'Legs', 5, 6)
    RETURNING id
  )
  INSERT INTO workout_day_exercises (workout_day_id, exercise_id, sort_order)
  SELECT l.id, e.id, row_number() OVER()
  FROM l, LATERAL (
    SELECT id FROM exercises WHERE user_id = p_user_id AND name IN (
      'Hack Squat Machine', 'Leg Press', 'Reverse Hamstring Curls',
      'Quad Extension', 'Calf Raises', 'Front Forearm Machine', 'Cable Wrist Flexors'
    )
    ORDER BY array_position(
      ARRAY['Hack Squat Machine', 'Leg Press', 'Reverse Hamstring Curls',
        'Quad Extension', 'Calf Raises', 'Front Forearm Machine', 'Cable Wrist Flexors'],
      name
    )
  ) e;

END;
$$;