export type FieldSchema = {
  key: string
  label: string
  type: 'toggle' | 'number' | 'select' | 'text' | 'time'
  options?: string[]
  variant?: 'segmented'
  min?: number
  max?: number
}[]

export type Habit = {
  id: string
  user_id: string
  name: string
  description: string | null
  field_schema: FieldSchema
  completion_field: string | null
  completion_value: string | null
  streak_direction: 'positive' | 'inverse'
  is_active: boolean
  sort_order: number
  created_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  log_date: string
  values: Record<string, unknown>
  logged_at: string
  auto_marked: boolean
  updated_at: string
}

export type Exercise = {
  id: string
  user_id: string
  name: string
  muscle_group: string | null
  default_rest_seconds: number | null
  is_active: boolean
  created_at: string
}

export type WorkoutDay = {
  id: string
  user_id: string
  name: string
  scheduled_weekday: number | null
  sort_order: number
}

export type WorkoutDayExercise = {
  id: string
  workout_day_id: string
  exercise_id: string
  sort_order: number
  superset_group_id?: string | null
}

export type WorkoutSession = {
  id: string
  user_id: string
  session_date: string
  workout_day_id: string | null
  notes: string | null
  created_at: string
}

export type SessionExercise = {
  id: string
  session_id: string
  exercise_id: string
  sort_order: number
  rest_seconds: number | null
  superset_group_id?: string | null
}

export type Set = {
  id: string
  session_exercise_id: string
  set_number: number
  weight_kg: number
  reps: number
  updated_at: string
}

export type BodyWeightLog = {
  id: string
  user_id: string
  log_date: string
  weight_kg: number
  logged_at: string
  updated_at: string
}