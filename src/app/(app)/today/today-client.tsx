'use client'

import { useState } from 'react'
import { Habit, HabitLog } from '@/lib/types'
import { HabitLogForm } from '@/components/habits/habit-log-form'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { todayPKT, pktDayOfWeek, isSundayPKT, isTodayPKT } from '@/lib/pkt-utils'
import { toast } from 'sonner'

const PRAYERS = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'] as const
type Prayer = (typeof PRAYERS)[number]

const PRAYER_LABELS: Record<Prayer, string> = {
  fajr: 'Fajr',
  zuhr: 'Zuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

function getPrayerLabel(prayer: Prayer, logDate: string): string {
  if (prayer === 'zuhr' && pktDayOfWeek(logDate) === 5) return 'Jumma'
  return PRAYER_LABELS[prayer]
}

function emptyPrayers(): Record<Prayer, Record<string, unknown>> {
  return Object.fromEntries(
    PRAYERS.map((p) => [p, {}]),
  ) as Record<Prayer, Record<string, unknown>>
}

function isNamaz(habit: Habit) {
  return habit.name === 'Namaz'
}

function isGym(habit: Habit) {
  return habit.name === 'Gym'
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(d)
}

export function TodayClient({
  habits,
  logsMap,
  logDate,
  bodyWeight,
}: {
  habits: Habit[]
  logsMap: Map<string, HabitLog>
  logDate: string
  bodyWeight: number | null
}) {
  const [saving, setSaving] = useState(false)
  const [bodyWeightInput, setBodyWeightInput] = useState(
    bodyWeight !== null ? String(bodyWeight) : '',
  )
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(() => {
    const initial: Record<string, Record<string, unknown>> = {}
    for (const habit of habits) {
      const existing = logsMap.get(habit.id)
      if (isNamaz(habit)) {
        const raw = existing?.values as Record<string, unknown> | undefined
        initial[habit.id] = raw?.prayers
          ? (raw as Record<string, unknown>)
          : { prayers: emptyPrayers() }
      } else {
        initial[habit.id] = existing?.values as Record<string, unknown> ?? {}
      }
    }
    return initial
  })
  const router = useRouter()
  const supabase = createClient()

  function handleChange(habitId: string, fieldValues: Record<string, unknown>) {
    setValues((prev) => ({ ...prev, [habitId]: fieldValues }))
  }

  function handlePrayerChange(
    habitId: string,
    prayer: Prayer,
    prayerValues: Record<string, unknown>,
  ) {
    setValues((prev) => {
      const current = prev[habitId] ?? {}
      return {
        ...prev,
        [habitId]: {
          ...current,
          prayers: {
            ...(current.prayers as Record<string, Record<string, unknown>>),
            [prayer]: prayerValues,
          },
        },
      }
    })
  }

  function navigateDate(newDate: string) {
    router.push(`/today?date=${newDate}`)
  }

  async function handleSave() {
    setSaving(true)
    let hasError = false

    for (const habit of habits) {
      if (isGym(habit) && isSundayPKT(logDate)) continue

      const payload = {
        habit_id: habit.id,
        log_date: logDate,
        values: values[habit.id] ?? {},
      }

      const { error } = await supabase
        .from('habit_logs')
        .upsert(payload, { onConflict: 'habit_id, log_date' })

      if (error) {
        console.error(error)
        hasError = true
      }
    }

    if (bodyWeightInput) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('body_weight_logs')
          .upsert(
            {
              user_id: user.id,
              log_date: logDate,
              weight_kg: parseFloat(bodyWeightInput),
            },
            { onConflict: 'user_id, log_date' },
          )
        if (error) {
          console.error(error)
          hasError = true
        }
      }
    }

    setSaving(false)

    if (hasError) {
      toast.error('Failed to save some entries')
    } else {
      toast.success('Saved')
    }

    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Today</h1>
        <span className="text-xs text-text-secondary">
          {isTodayPKT(logDate) ? 'Today' : logDate}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
        <button
          type="button"
          onClick={() => navigateDate(shiftDate(logDate, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <input
          type="date"
          value={logDate}
          onChange={(e) => navigateDate(e.target.value)}
          className="bg-transparent text-center text-sm font-medium text-text-primary focus:outline-none"
        />

        <button
          type="button"
          onClick={() => navigateDate(shiftDate(logDate, 1))}
          disabled={isTodayPKT(logDate)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary disabled:opacity-40"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">Body Weight</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={bodyWeightInput}
            onChange={(e) => setBodyWeightInput(e.target.value)}
            placeholder="Weight (kg)"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          <span className="text-sm text-text-secondary">kg</span>
        </div>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => {
          if (isNamaz(habit)) {
            const prayers = (values[habit.id] as { prayers?: Record<Prayer, Record<string, unknown>> } | undefined)
              ?.prayers ?? emptyPrayers()
            const namazSchema = habit.field_schema.map((f) =>
              f.type === 'select' && f.options && f.options.length <= 3
                ? { ...f, variant: 'segmented' as const }
                : f,
            )
            return (
              <div key={habit.id} className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-3 text-sm font-semibold">{habit.name}</h2>
                <div className="space-y-4">
                  {PRAYERS.map((prayer) => (
                    <div key={prayer}>
                      <h3 className="mb-2 text-xs font-medium text-text-secondary">
                        {getPrayerLabel(prayer, logDate)}
                      </h3>
                      <HabitLogForm
                        schema={namazSchema}
                        values={prayers[prayer] ?? {}}
                        onChange={(v) => handlePrayerChange(habit.id, prayer, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          if (isGym(habit) && isSundayPKT(logDate)) {
            return (
              <div key={habit.id} className="rounded-xl border border-border bg-surface p-4 opacity-40">
                <h2 className="mb-3 text-sm font-semibold">{habit.name}</h2>
                <p className="text-sm text-text-secondary">N/A — Sunday (rest day)</p>
              </div>
            )
          }

          return (
            <div
              key={habit.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <h2 className="mb-3 text-sm font-semibold">{habit.name}</h2>
              {habit.description && (
                <p className="mb-2 text-xs text-text-secondary">{habit.description}</p>
              )}
              <HabitLogForm
                schema={habit.field_schema}
                values={values[habit.id] ?? {}}
                onChange={(v) => handleChange(habit.id, v)}
              />
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary-container px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? 'Saving...' : 'Save Day'}
      </button>
    </div>
  )
}