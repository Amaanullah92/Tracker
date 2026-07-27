import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GymHome } from './gym-home'
import { todayPKT, pktDayOfWeek } from '@/lib/pkt-utils'

export const dynamic = 'force-dynamic'

export default async function GymPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = todayPKT()
  const weekday = pktDayOfWeek(today)

  const { data: templates } = await supabase
    .from('workout_days')
    .select('*')
    .order('sort_order')

  const suggested = templates?.find((t) => t.scheduled_weekday === weekday) ?? null

  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('session_date', { ascending: false })
    .limit(10)

  const { data: todayLog } = await supabase
    .from('body_weight_logs')
    .select('*')
    .eq('log_date', today)
    .single()

  const templatesWithExercises = await Promise.all(
    (templates ?? []).map(async (t) => {
      const { data: exercises } = await supabase
        .from('workout_day_exercises')
        .select('*, exercises(name, muscle_group)')
        .eq('workout_day_id', t.id)
        .order('sort_order')
      return { ...t, exercises: exercises ?? [] }
    }),
  )

  return (
    <GymHome
      suggested={suggested ? { ...suggested, exercises: templatesWithExercises.find((t) => t.id === suggested.id)?.exercises ?? [] } : null}
      templates={templatesWithExercises}
      recentSessions={recentSessions ?? []}
      today={today}
      userId={user!.id}
      bodyWeightToday={todayLog ?? null}
    />
  )
}