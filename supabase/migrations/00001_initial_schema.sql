-- Create habits table
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  field_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  streak_direction text NOT NULL DEFAULT 'positive' CHECK (streak_direction IN ('positive', 'inverse')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create habit_logs table
CREATE TABLE habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  logged_at timestamptz NOT NULL DEFAULT now(),
  auto_marked boolean NOT NULL DEFAULT false,
  UNIQUE (habit_id, log_date)
);

-- Create exercises table
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text,
  default_rest_seconds int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create workout_days table
CREATE TABLE workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  scheduled_weekday int CHECK (scheduled_weekday >= 0 AND scheduled_weekday <= 6),
  sort_order int NOT NULL DEFAULT 0
);

-- Create workout_day_exercises join table
CREATE TABLE workout_day_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id uuid NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  superset_group_id text
);

-- Create workout_sessions table
CREATE TABLE workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  workout_day_id uuid REFERENCES workout_days(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create session_exercises table
CREATE TABLE session_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  rest_seconds int,
  superset_group_id text
);

-- Create sets table
CREATE TABLE sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id uuid NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_number int NOT NULL,
  weight_kg numeric NOT NULL,
  reps int NOT NULL,
  UNIQUE (session_exercise_id, set_number)
);

-- Create body_weight_logs table
CREATE TABLE body_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  weight_kg numeric NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- Create indexes for common queries
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, log_date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, session_date);
CREATE INDEX idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX idx_sets_session_exercise ON sets(session_exercise_id);

-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

-- RLS: direct user_id tables
CREATE POLICY "users own their habits" ON habits
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "users own their habit_logs" ON habit_logs
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "users own their exercises" ON exercises
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "users own their workout_days" ON workout_days
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "users own their workout_sessions" ON workout_sessions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "users own their body_weight_logs" ON body_weight_logs
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- RLS: join-based tables (user_id reachable via FK chain)
-- workout_day_exercises: user_id via workout_days
CREATE POLICY "users own their workout_day_exercises" ON workout_day_exercises
  FOR ALL TO authenticated
  USING (
    (select auth.uid()) = (select user_id from workout_days where id = workout_day_id)
  )
  WITH CHECK (
    (select auth.uid()) = (select user_id from workout_days where id = workout_day_id)
  );

-- session_exercises: user_id via workout_sessions
CREATE POLICY "users own their session_exercises" ON session_exercises
  FOR ALL TO authenticated
  USING (
    (select auth.uid()) = (select user_id from workout_sessions where id = session_id)
  )
  WITH CHECK (
    (select auth.uid()) = (select user_id from workout_sessions where id = session_id)
  );

-- sets: user_id via session_exercises -> workout_sessions
CREATE POLICY "users own their sets" ON sets
  FOR ALL TO authenticated
  USING (
    (select auth.uid()) = (
      select ws.user_id from workout_sessions ws
      join session_exercises se on se.session_id = ws.id
      where se.id = session_exercise_id
    )
  )
  WITH CHECK (
    (select auth.uid()) = (
      select ws.user_id from workout_sessions ws
      join session_exercises se on se.session_id = ws.id
      where se.id = session_exercise_id
    )
  );