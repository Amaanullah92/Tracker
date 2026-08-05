'use client'

import { useState, useEffect } from 'react'
import { Habit, HabitLog, BodyWeightLog } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { computeStreak } from '@/lib/streak-engine'
import { getChartableFields, getChartTypeForField, dateRangeDates, extractPrayerLogs, PRAYER_NAMES } from '@/lib/analytics-utils'
import { CompletionChart } from '@/components/analytics/completion-chart'
import { TrendChart } from '@/components/analytics/trend-chart'
import { DistributionChart } from '@/components/analytics/distribution-chart'
import { GymCharts } from '@/components/analytics/gym-charts'
import { AppHeader } from '@/components/ui/app-header'
import { Card } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Flame, Trophy, Scale } from 'lucide-react'

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

const ranges = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All' },
] as const

export function StatsClient({
  habits,
  bodyWeightLogs,
  workoutSessions,
  workoutDayNames,
}: {
  habits: Habit[]
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

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        title="Stats"
        eyebrow="Progress & trends"
        right={
          <SegmentedControl
            options={ranges.map((r) => ({ value: r.key, label: r.label }))}
            value={range}
            onChange={setRange}
            ariaLabel="Statistic range"
          />
        }
      />

      {habits.map((habit) => {
        const logs = habitLogs[habit.id] ?? []
        const streak = computeStreak(habit, logs)
        const chartableFields = getChartableFields(habit.field_schema)

        return (
          <Card key={habit.id} className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-headline text-headline text-text-primary">
                {habit.name}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
                    streak.current > 0 ? 'bg-primary/15 text-primary' : 'bg-surface-elevated text-text-tertiary'
                  }`}
                  title="Current streak"
                >
                  <Flame className="h-4 w-4" aria-hidden />
                  <span className="font-display text-lg font-bold tabular-nums">{streak.current}</span>
                  <span className="text-tiny font-medium">streak</span>
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1.5 text-text-secondary"
                  title="Longest streak"
                >
                  <Trophy className="h-4 w-4" aria-hidden />
                  <span className="font-display text-lg font-bold tabular-nums">{streak.longest}</span>
                </span>
              </div>
            </div>

            {habit.name === 'Namaz' ? (
              <div className="space-y-3">
                {PRAYER_NAMES.map((prayer) => {
                  const prayerLogs = extractPrayerLogs(logs, prayer)
                  return (
                    <div key={prayer} className="space-y-2.5 rounded-lg bg-surface-elevated/60 p-3">
                      <p className="font-mono text-label text-label uppercase text-text-secondary">
                        {prayer}
                      </p>
                      <div>
                        <p className="mb-0.5 text-tiny text-text-tertiary">Status</p>
                        <DistributionChart
                          logs={prayerLogs}
                          selectKey="status"
                          options={['Prayed', 'Not Prayed']}
                        />
                      </div>
                      <div>
                        <p className="mb-0.5 text-tiny text-text-tertiary">With Jamat?</p>
                        <CompletionChart
                          logs={prayerLogs}
                          completionField="jamat"
                          streakDirection={habit.streak_direction}
                        />
                      </div>
                      <div>
                        <p className="mb-0.5 text-tiny text-text-tertiary">Completeness</p>
                        <DistributionChart
                          logs={prayerLogs}
                          selectKey="completeness"
                          options={['Full', 'Partial', 'Farz Only']}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {chartableFields.length === 0 && (
                  <p className="text-sm text-text-tertiary">No chartable fields</p>
                )}

                {chartableFields.map((field) => {
                  const chartType = getChartTypeForField(field)

                  if (chartType === 'completion') {
                    return (
                      <div key={field.key}>
                        <p className="mb-1 font-mono text-label text-label uppercase text-text-secondary">
                          {field.label}
                        </p>
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
                      <div key={field.key}>
                        <p className="mb-1 font-mono text-label text-label uppercase text-text-secondary">
                          {field.label}
                        </p>
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
                      <div key={field.key}>
                        <p className="mb-1 font-mono text-label text-label uppercase text-text-secondary">
                          {field.label}
                        </p>
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
              </div>
            )}
          </Card>
        )
      })}

      {/* Body weight chart */}
      {bodyWeightLogs.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-text-tertiary" aria-hidden />
            <h2 className="font-display text-headline text-headline text-text-primary">Body Weight</h2>
          </div>
          <TrendChart
            logs={bodyWeightLogs.map((l) => ({
              log_date: l.log_date,
              values: { weight: l.weight_kg },
            }))}
            valueKey="weight"
            label="Weight (kg)"
          />
        </Card>
      )}

      {/* Gym Analytics */}
      {workoutSessions.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-4 font-display text-headline text-headline text-text-primary">
            Gym Analytics
          </h2>
          <GymCharts sessions={workoutSessions} workoutDayNames={workoutDayNames} />
        </Card>
      )}
    </div>
  )
}
