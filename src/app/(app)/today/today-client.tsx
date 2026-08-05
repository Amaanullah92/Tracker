'use client'

import { useState } from 'react'
import { Habit, HabitLog } from '@/lib/types'
import { HabitLogForm } from '@/components/habits/habit-log-form'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays, Flame } from 'lucide-react'
import {
  pktDayOfWeek,
  isSundayPKT,
  isTodayPKT,
  shiftDatePKT,
  formatDatePKT,
} from '@/lib/pkt-utils'
import { toast } from 'sonner'
import { shouldQueue, fetchBaseVersion } from '@/lib/offline'
import { enqueue } from '@/lib/db-queue'
import { AppHeader } from '@/components/ui/app-header'
import { Card } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmberWick, WickDay } from '@/components/ui/ember-wick'

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

export function TodayClient({
  habits,
  logsMap,
  wickDays,
  logDate,
  userId,
  bodyWeight,
}: {
  habits: Habit[]
  logsMap: Map<string, HabitLog>
  wickDays: Map<string, WickDay[]>
  logDate: string
  userId: string
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

  const [dirty, setDirty] = useState<Set<string>>(new Set())

  function handleChange(habitId: string, fieldValues: Record<string, unknown>) {
    setValues((prev) => ({ ...prev, [habitId]: fieldValues }))
    setDirty((prev) => new Set(prev).add(habitId))
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
    setDirty((prev) => new Set(prev).add(habitId))
  }

  function navigateDate(newDate: string) {
    router.push(`/today?date=${newDate}`)
  }

  async function handleSave() {
    setSaving(true)
    let hasError = false
    let queuedCount = 0

    for (const habit of habits) {
      if (isGym(habit) && isSundayPKT(logDate)) continue
      if (!dirty.has(habit.id)) continue

      const payload = {
        habit_id: habit.id,
        log_date: logDate,
        values: values[habit.id] ?? {},
      }

      const { error } = await supabase
        .from('habit_logs')
        .upsert(payload, { onConflict: 'habit_id, log_date' })

      if (error) {
        if (shouldQueue(error)) {
          const existingLog = logsMap.get(habit.id)
          await enqueue({
            type: 'habit_log',
            action: 'upsert',
            payload,
            targetKey: { habit_id: habit.id, log_date: logDate },
            baseVersion: existingLog?.updated_at ?? 'UNKNOWN',
          })
          queuedCount++
        } else {
          console.error(error)
          hasError = true
        }
      }
    }

    const bodyWeightChanged = bodyWeight !== null
      ? parseFloat(bodyWeightInput) !== bodyWeight
      : bodyWeightInput !== ''

    if (bodyWeightInput && bodyWeightChanged) {
      const { error } = await supabase
        .from('body_weight_logs')
        .upsert(
          {
            log_date: logDate,
            weight_kg: parseFloat(bodyWeightInput),
          },
          { onConflict: 'user_id, log_date' },
        )
      if (error) {
        if (shouldQueue(error)) {
          const baseVersion = await fetchBaseVersion(
            'body_weight_logs',
            { user_id: userId, log_date: logDate },
          )
          await enqueue({
            type: 'body_weight',
            action: 'upsert',
            payload: { user_id: userId, log_date: logDate, weight_kg: parseFloat(bodyWeightInput) },
            targetKey: { user_id: userId, log_date: logDate },
            baseVersion,
          })
          queuedCount++
        } else {
          console.error(error)
          hasError = true
        }
      }
    }

    setSaving(false)

    if (hasError) {
      toast.error('Failed to save some entries')
    } else if (queuedCount > 0) {
      toast.info(`${queuedCount} ${queuedCount === 1 ? 'entry' : 'entries'} saved offline`)
    } else {
      toast.success('Day saved')
      router.refresh()
    }
  }

  const dirtyCount = dirty.size

  return (
    <>
      <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-28">
        <AppHeader
          title="Today"
          eyebrow={formatDatePKT(logDate)}
          right={
            <span className="flex items-center gap-1.5 font-mono text-label text-label uppercase text-text-tertiary">
              <Flame className="h-4 w-4 text-primary" aria-hidden />
              {isTodayPKT(logDate) ? 'Today' : logDate}
            </span>
          }
        />

        {/* Date navigator */}
        <Card className="flex items-center justify-between px-1.5 py-1">
          <button
            type="button"
            onClick={() => navigateDate(shiftDatePKT(logDate, -1))}
            className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <label className="flex flex-col items-center">
            <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-text-primary">
              <CalendarDays className="h-4 w-4 text-text-tertiary" aria-hidden />
              {formatDatePKT(logDate, 'medium')}
            </span>
            <input
              type="date"
              value={logDate}
              onChange={(e) => navigateDate(e.target.value)}
              className="w-36 cursor-pointer bg-transparent text-center font-mono text-xs text-text-tertiary outline-none"
              aria-label="Select date"
            />
          </label>

          <button
            type="button"
            onClick={() => navigateDate(shiftDatePKT(logDate, 1))}
            disabled={isTodayPKT(logDate)}
            className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary disabled:pointer-events-none disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </Card>

        {/* Body weight */}
        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-headline text-headline text-text-primary">
              Body Weight
            </h2>
            <span className="font-mono text-label text-label uppercase text-text-tertiary">kg</span>
          </div>
          <Stepper
            label="Body weight (kg)"
            value={bodyWeightInput}
            onChange={setBodyWeightInput}
            min={20}
            max={300}
            step={0.5}
          />
        </Card>

        {/* Habits */}
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
                <Card key={habit.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="font-display text-headline text-headline text-text-primary">
                      {habit.name}
                    </h2>
                    <EmberWick
                      days={wickDays.get(habit.id) ?? []}
                      label={`${habit.name}: last 7 days`}
                    />
                  </div>
                  <div className="divide-y divide-border">
                    {PRAYERS.map((prayer) => (
                      <div key={prayer} className="py-3 first:pt-0 last:pb-0">
                        <p className="mb-2 font-mono text-label text-label uppercase text-text-secondary">
                          {getPrayerLabel(prayer, logDate)}
                        </p>
                        <HabitLogForm
                          schema={namazSchema}
                          values={prayers[prayer] ?? {}}
                          onChange={(v) => handlePrayerChange(habit.id, prayer, v)}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )
            }

            if (isGym(habit) && isSundayPKT(logDate)) {
              return (
                <Card key={habit.id} className="p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-headline text-headline text-text-primary">
                      {habit.name}
                    </h2>
                    <Badge tone="neutral" mono>
                      Rest Day
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    N/A — Sunday (rest day)
                  </p>
                </Card>
              )
            }

            return (
              <Card key={habit.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-headline text-headline text-text-primary">
                      {habit.name}
                    </h2>
                    {habit.description && (
                      <p className="mt-0.5 text-sm text-text-secondary">{habit.description}</p>
                    )}
                  </div>
                  <EmberWick
                    days={wickDays.get(habit.id) ?? []}
                    label={`${habit.name}: last 7 days`}
                  />
                </div>
                <HabitLogForm
                  schema={habit.field_schema}
                  values={values[habit.id] ?? {}}
                  onChange={(v) => handleChange(habit.id, v)}
                />
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 py-3">
        <Button
          onClick={handleSave}
          size="lg"
          loading={saving}
          disabled={dirtyCount === 0 && !bodyWeightInput}
          className="w-full shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
        >
          {saving ? 'Saving…' : dirtyCount > 0 ? `Save Day${dirtyCount > 1 ? ` (${dirtyCount})` : ''}` : 'Save Day'}
        </Button>
      </div>
    </>
  )
}
