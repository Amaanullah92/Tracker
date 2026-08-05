import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TodayClient } from './today-client'
import { todayPKT, shiftDatePKT } from '@/lib/pkt-utils'
import { isLogDone } from '@/lib/streak-engine'
import type { WickDay } from '@/components/ui/ember-wick'
import type { Habit, HabitLog } from '@/lib/types'

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const logDate = date ?? todayPKT()
  const windowStart = shiftDatePKT(logDate, -6)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: habits }, { data: logs }, { data: windowLogs }, { data: bodyWeight }] =
    await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('habit_logs')
        .select('*')
        .eq('log_date', logDate),
      supabase
        .from('habit_logs')
        .select('*')
        .gte('log_date', windowStart)
        .lte('log_date', logDate),
      supabase
        .from('body_weight_logs')
        .select('weight_kg, updated_at')
        .eq('log_date', logDate)
        .maybeSingle(),
    ])

  const logsMap = new Map((logs ?? []).map((l) => [l.habit_id, l]))

  // Ember wick: last 7 days of completion per habit
  const today = todayPKT()
  const wickDays = new Map<string, WickDay[]>()
  for (const habit of (habits ?? []) as Habit[]) {
    const days: WickDay[] = []
    for (let i = 6; i >= 0; i--) {
      const day = shiftDatePKT(logDate, -i)
      const log = (windowLogs ?? []).find(
        (l: HabitLog) => l.habit_id === habit.id && l.log_date === day,
      )
      days.push({
        date: day,
        done: log ? isLogDone(habit, log) : false,
        isToday: day === today,
      })
    }
    wickDays.set(habit.id, days)
  }

  return (
    <TodayClient
      habits={(habits ?? []) as Habit[]}
      logsMap={logsMap}
      wickDays={wickDays}
      logDate={logDate}
      userId={user!.id}
      bodyWeight={bodyWeight?.weight_kg ?? null}
    />
  )
}
