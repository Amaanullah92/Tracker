import { createClient } from '@/lib/supabase/server'
import { SessionPageClient } from './session-client'

export const dynamic = 'force-dynamic'

export default async function GymSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) return <div className="p-4 text-sm text-text-secondary">Session not found</div>

  const { data: sessionExercises } = await supabase
    .from('session_exercises')
    .select('*, exercises(name, muscle_group, default_rest_seconds)')
    .eq('session_id', id)
    .order('sort_order')

  const exerciseIds = sessionExercises?.map((se) => se.exercise_id) ?? []

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const availableExercises = (exercises ?? []).filter(
    (e) => !exerciseIds.includes(e.id),
  )

  const { data: allSets } = await supabase
    .from('sets')
    .select('*, session_exercises!inner(session_id, exercise_id)')
    .in('session_exercises.exercise_id', exerciseIds)
    .order('set_number')

  return (
    <SessionPageClient
      session={session}
      sessionExercises={sessionExercises ?? []}
      availableExercises={availableExercises}
      allSets={allSets ?? []}
    />
  )
}