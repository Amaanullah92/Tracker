import { createClient } from '@/lib/supabase/server'
import { StatsClient } from './stats-client'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const supabase = await createClient()

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)

  const { data: bodyWeightLogs } = await supabase
    .from('body_weight_logs')
    .select('*')
    .order('log_date')

  // Fetch workout sessions with nested sets for gym analytics
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id, session_date, workout_day_id,
      session_exercises (
        id, exercise_id, sets (*)
      )
    `)
    .order('session_date', { ascending: true })

  // Fetch workout days for template name lookup
  const { data: workoutDays } = await supabase
    .from('workout_days')
    .select('id, name')

  const workoutDayNames: Record<string, string> = {}
  for (const wd of workoutDays ?? []) {
    workoutDayNames[wd.id] = wd.name
  }

  // Enrich session exercises with exercise names
  const exerciseMap = new Map((exercises ?? []).map((e) => [e.id, e.name]))
  const enrichedSessions = (sessions ?? []).map((s: any) => ({
    ...s,
    session_exercises: (s.session_exercises ?? []).map((se: any) => ({
      ...se,
      exercise_name: exerciseMap.get(se.exercise_id) ?? null,
    })),
  }))

  return (
    <StatsClient
      habits={habits ?? []}
      exercises={exercises ?? []}
      bodyWeightLogs={bodyWeightLogs ?? []}
      workoutSessions={enrichedSessions}
      workoutDayNames={workoutDayNames}
    />
  )
}