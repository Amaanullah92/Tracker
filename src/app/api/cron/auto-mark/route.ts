import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { todayPKT, pktDayOfWeek } from '@/lib/pkt-utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getYesterdayKarachi(): string {
  const today = todayPKT()
  const d = new Date(today + 'T12:00:00Z')
  d.setDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getDefaultValues(fieldSchema: unknown): Record<string, unknown> {
  if (!Array.isArray(fieldSchema)) return {}

  const values: Record<string, unknown> = {}
  for (const field of fieldSchema) {
    switch (field.type) {
      case 'toggle':
        values[field.key] = false
        break
      case 'number':
        values[field.key] = 0
        break
      case 'select':
        if (Array.isArray(field.options) && field.options.length > 0) {
          values[field.key] = field.options[field.options.length - 1]
        }
        break
      case 'text':
        values[field.key] = ''
        break
      case 'time':
        values[field.key] = ''
        break
    }
  }
  return values
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const yesterday = getYesterdayKarachi()

  // Get all users with active habits
  const { data: habits, error: habitErr } = await adminClient
    .from('habits')
    .select('*')
    .eq('is_active', true)

  if (habitErr) {
    return NextResponse.json({ error: habitErr.message }, { status: 500 })
  }

  let marked = 0

  for (const habit of habits) {
    // Skip Gym on Sunday (auto-N/A)
    if (habit.name === 'Gym' && pktDayOfWeek(yesterday) === 0) continue

    // Check if a log already exists for yesterday
    const { data: existingLog } = await adminClient
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habit.id)
      .eq('user_id', habit.user_id)
      .eq('log_date', yesterday)
      .maybeSingle()

    if (existingLog) continue

    let values: Record<string, unknown>

    if (habit.name === 'Namaz') {
      // For Namaz, mark all 5 prayers as "Not Prayed"
      const defaultPrayer = {
        status: 'Not Prayed',
        jamat: false,
        completeness: 'Farz Only',
      }
      values = {
        prayers: {
          fajr: { ...defaultPrayer },
          zuhr: { ...defaultPrayer },
          asr: { ...defaultPrayer },
          maghrib: { ...defaultPrayer },
          isha: { ...defaultPrayer },
        },
      }
    } else {
      values = getDefaultValues(habit.field_schema)
    }

    const { error: insertErr } = await adminClient.from('habit_logs').insert({
      habit_id: habit.id,
      user_id: habit.user_id,
      log_date: yesterday,
      values,
      auto_marked: true,
    })

    if (!insertErr) marked++
  }

  return NextResponse.json({ marked, date: yesterday })
}