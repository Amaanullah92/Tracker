import { Habit, HabitLog } from '@/lib/types'

export type StreakResult = {
  current: number
  longest: number
}

/**
 * One pure function branching on streak_direction.
 *
 * "Done" is determined by an explicit completion signal
 * (completion_field / completion_value on the habit), NOT inferred
 * from value shape.
 *
 * Namaz is the only hardcoded special case: all 5 prayers must have
 * completion_value (e.g. "Prayed") in their status field.
 *
 * Auto_marked rows represent unlogged days — for positive habits they
 * break the streak, for inverse habits they extend it (clean day).
 */
export function computeStreak(
  habit: Pick<Habit, 'name' | 'completion_field' | 'completion_value' | 'streak_direction'>,
  logs: Pick<HabitLog, 'log_date' | 'auto_marked' | 'values'>[],
  exceptionDates: Set<string> = new Set(),
): StreakResult {
  if (logs.length === 0) return { current: 0, longest: 0 }

  const sorted = [...logs].sort(
    (a, b) => a.log_date.localeCompare(b.log_date),
  )

  let longest = 0
  let currentRun = 0

  for (const log of sorted) {
    if (exceptionDates.has(log.log_date)) continue

    const done = isLogDone(habit, log)

    if (habit.streak_direction === 'positive') {
      if (done) {
        currentRun++
      } else {
        if (currentRun > longest) longest = currentRun
        currentRun = 0
      }
    } else {
      // inverse: done breaks, not-done extends
      if (done) {
        if (currentRun > longest) longest = currentRun
        currentRun = 0
      } else {
        currentRun++
      }
    }
  }

  if (currentRun > longest) longest = currentRun

  return { current: currentRun, longest }
}

function isLogDone(
  habit: Pick<Habit, 'name' | 'completion_field' | 'completion_value'>,
  log: Pick<HabitLog, 'auto_marked' | 'values'>,
): boolean {
  // Auto-marked rows are never "done" by the user
  if (log.auto_marked) return false

  // Namaz special case: all 5 prayers must have status = completion_value ("Prayed")
  if (habit.name === 'Namaz') {
    const prayers = (log.values as { prayers?: Record<string, Record<string, unknown>> })?.prayers
    if (!prayers) return false
    const prayerNames = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha']
    return prayerNames.every(
      (p) => (prayers[p] as Record<string, unknown> | undefined)?.status === habit.completion_value,
    )
  }

  // completion_field is null: any user-entered values = done
  if (!habit.completion_field) {
    return Object.keys(log.values).length > 0
  }

  // completion_field is set: evaluate by field type
  const val = log.values[habit.completion_field]

  if (typeof val === 'boolean') return val === true
  if (typeof val === 'string') {
    if (habit.completion_value) return val === habit.completion_value
    return val.length > 0
  }
  if (typeof val === 'number') return true

  return false
}