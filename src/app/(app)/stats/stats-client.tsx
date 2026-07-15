'use client'

import { useState, useEffect } from 'react'
import { Habit, Exercise, HabitLog, BodyWeightLog } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { computeStreak } from '@/lib/streak-engine'
import { getChartableFields, getChartTypeForField, dateRangeDates, extractPrayerLogs, PRAYER_NAMES } from '@/lib/analytics-utils'
import { CompletionChart } from '@/components/analytics/completion-chart'
import { TrendChart } from '@/components/analytics/trend-chart'
import { DistributionChart } from '@/components/analytics/distribution-chart'
import { GymCharts } from '@/components/analytics/gym-charts'

type WorkoutSessionData = {
  id: string
  session_date: string
  workout_day_id: string | null
  session_exercises: {
    id: string
    exercise_id: string
    exercise_name?: string | null
    sets: { weight_kg: number; reps: number }[]
  }[]
}

export function StatsClient({
  habits,
  exercises,
  bodyWeightLogs,
  workoutSessions,
  workoutDayNames,
}: {
  habits: Habit[]
  exercises: Exercise[]
  bodyWeightLogs: BodyWeightLog[]
  workoutSessions: WorkoutSessionData[]
  workoutDayNames: Record<string, string>
}) {
  const [range, setRange] = useState('30d')
  const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog[]>>({})
  const supabase = createClient()

  const { start, end } = dateRangeDates(range)

  useEffect(() => {
    async function fetchLogs() {
      const habitIds = habits.map((h) => h.id)
      if (habitIds.length === 0) return

      const { data } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds)
        .gte('log_date', start)
        .lte('log_date', end)
        .order('log_date')

      if (data) {
        const grouped: Record<string, HabitLog[]> = {}
        for (const log of data) {
          if (!grouped[log.habit_id]) grouped[log.habit_id] = []
          grouped[log.habit_id].push(log)
        }
        setHabitLogs(grouped)
      }
    }
    fetchLogs()
  }, [range])

  const ranges = [
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: '90d', label: '90d' },
    { key: 'all', label: 'All' },
  ] as const

  return (
    <div className="mx-auto max-w-[480px] px-margin-x space-y-4 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-text-primary">Stats Overview</h2>
        <div className="flex bg-surface-elevated rounded-lg p-1 gap-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-3 py-1 font-label-caps text-label-caps ${
                range === r.key ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary transition-colors'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {habits.map((habit) => {
        const logs = habitLogs[habit.id] ?? []
        const streak = computeStreak(habit, logs)
        const chartableFields = getChartableFields(habit.field_schema)

        return (
          <div key={habit.id} className="rounded-xl bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{habit.name}</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-text-secondary">
                  Streak: <strong className={streak.current > 0 ? 'text-primary' : 'text-destructive'}>
                    {streak.current}
                  </strong>
                </span>
                <span className="text-text-secondary">
                  Best: <strong>{streak.longest}</strong>
                </span>
              </div>
            </div>

            {habit.name === 'Namaz' ? (
              <div className="space-y-3">
                {PRAYER_NAMES.map((prayer) => {
                  const prayerLogs = extractPrayerLogs(logs, prayer)
                  return (
                    <div key={prayer} className="rounded-lg bg-surface-elevated px-3 py-2.5">
                      <p className="mb-2 text-xs font-semibold capitalize text-text-secondary">{prayer}</p>
                      <div className="space-y-2">
                        <div>
                          <p className="mb-0.5 text-[11px] text-text-tertiary">Status</p>
                          <DistributionChart
                            logs={prayerLogs}
                            selectKey="status"
                            options={['Prayed', 'Not Prayed']}
                          />
                        </div>
                        <div>
                          <p className="mb-0.5 text-[11px] text-text-tertiary">With Jamat?</p>
                          <CompletionChart
                            logs={prayerLogs}
                            completionField="jamat"
                            streakDirection={habit.streak_direction}
                          />
                        </div>
                        <div>
                          <p className="mb-0.5 text-[11px] text-text-tertiary">Completeness</p>
                          <DistributionChart
                            logs={prayerLogs}
                            selectKey="completeness"
                            options={['Full', 'Partial', 'Farz Only']}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                {chartableFields.length === 0 && (
                  <p className="text-xs text-text-secondary">No chartable fields</p>
                )}

                {chartableFields.map((field) => {
                  const chartType = getChartTypeForField(field)

                  if (chartType === 'completion') {
                    return (
                      <div key={field.key} className="mb-3">
                        <p className="mb-1 font-label-caps text-label-caps text-text-secondary">{field.label}</p>
                        <CompletionChart
                          logs={logs}
                          completionField={field.key}
                          streakDirection={habit.streak_direction}
                        />
                      </div>
                    )
                  }

                  if (chartType === 'trend' && field.type === 'number') {
                    return (
                      <div key={field.key} className="mb-3">
                        <p className="mb-1 font-label-caps text-label-caps text-text-secondary">{field.label}</p>
                        <TrendChart
                          logs={logs}
                          valueKey={field.key}
                          label={field.label}
                        />
                      </div>
                    )
                  }

                  if (chartType === 'distribution' && field.type === 'select') {
                    return (
                      <div key={field.key} className="mb-3">
                        <p className="mb-1 font-label-caps text-label-caps text-text-secondary">{field.label}</p>
                        <DistributionChart
                          logs={logs}
                          selectKey={field.key}
                          options={field.options ?? []}
                        />
                      </div>
                    )
                  }

                  return null
                })}
              </>
            )}
          </div>
        )
      })}

      {/* Body weight chart */}
      {bodyWeightLogs.length > 0 && (
        <div className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Body Weight</h2>
          <TrendChart
            logs={bodyWeightLogs.map((l) => ({
              log_date: l.log_date,
              values: { weight: l.weight_kg },
            }))}
            valueKey="weight"
            label="Weight (kg)"
          />
        </div>
      )}

      {/* Gym Analytics */}
      {workoutSessions.length > 0 && (
        <div className="rounded-xl bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold">Gym Analytics</h2>
          <GymCharts sessions={workoutSessions} workoutDayNames={workoutDayNames} />
        </div>
      )}
    </div>
  )
}