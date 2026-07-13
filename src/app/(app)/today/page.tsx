import { createClient } from '@/lib/supabase/server'
import { TodayClient } from './today-client'
import { todayPKT } from '@/lib/pkt-utils'

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const logDate = date ?? todayPKT()

  const supabase = await createClient()

  const [{ data: habits }, { data: logs }, { data: bodyWeight }] =
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
        .from('body_weight_logs')
        .select('weight_kg')
        .eq('log_date', logDate)
        .maybeSingle(),
    ])

  const logsMap = new Map((logs ?? []).map((l) => [l.habit_id, l]))

  return (
    <TodayClient
      habits={habits ?? []}
      logsMap={logsMap}
      logDate={logDate}
      bodyWeight={bodyWeight?.weight_kg ?? null}
    />
  )
}