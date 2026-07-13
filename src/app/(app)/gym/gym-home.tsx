'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Dumbbell, Plus, Scale } from 'lucide-react'
import { pktDayOfWeek } from '@/lib/pkt-utils'

type WorkoutDayWithExercises = {
  id: string
  name: string
  scheduled_weekday: number | null
  sort_order: number
  exercises: {
    id: string
    exercise_id: string
    sort_order: number
    superset_group_id: string | null
    exercises: { name: string; muscle_group: string | null } | null
  }[]
}

export function GymHome({
  suggested,
  templates,
  recentSessions,
  today,
  bodyWeightToday,
}: {
  suggested: WorkoutDayWithExercises | null
  templates: WorkoutDayWithExercises[]
  recentSessions: { id: string; session_date: string; notes: string | null }[]
  today: string
  bodyWeightToday: { id: string; weight_kg: number } | null
}) {
  const [showStart, setShowStart] = useState(false)
  const [showWeight, setShowWeight] = useState(!bodyWeightToday)
  const [weight, setWeight] = useState(bodyWeightToday?.weight_kg?.toString() ?? '')
  const [selectedTemplate, setSelectedTemplate] = useState(suggested?.id ?? 'ad-hoc')
  const [sessionDate, setSessionDate] = useState(today)
  const [starting, setStarting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleStartSession() {
    setStarting(true)
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        session_date: sessionDate,
        workout_day_id: selectedTemplate === 'ad-hoc' ? null : selectedTemplate,
      })
      .select()
      .single()

    if (error || !session) {
      console.error(error)
      setStarting(false)
      return
    }

    if (selectedTemplate !== 'ad-hoc') {
      const tpl = templates.find((t) => t.id === selectedTemplate)
      if (tpl) {
        await supabase.from('session_exercises').insert(
          tpl.exercises.map((ex, i) => ({
            session_id: session.id,
            exercise_id: ex.exercise_id,
            sort_order: i,
            rest_seconds: null,
            superset_group_id: ex.superset_group_id,
          })),
        )
      }
    }

    router.push(`/gym/${session.id}`)
  }

  async function handleSaveWeight() {
    if (!weight) return
    await supabase.from('body_weight_logs').upsert(
      { log_date: today, weight_kg: parseFloat(weight) },
      { onConflict: 'user_id, log_date' },
    )
    setShowWeight(false)
    router.refresh()
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekday = pktDayOfWeek(today)

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Gym</h1>
        <button
          onClick={() => setShowStart(true)}
          className="flex items-center gap-1 rounded-lg bg-primary-container px-3 py-2 text-xs font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Start Session
        </button>
      </div>

      {showWeight && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium">Log Body Weight</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight (kg)"
              className="flex-1 min-h-[44px] rounded-lg border border-border bg-surface-elevated px-3 text-sm text-text-primary"
            />
            <button
              onClick={handleSaveWeight}
              disabled={!weight}
              className="rounded-lg bg-primary-container px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {suggested && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Suggested Today</h2>
            <span className="rounded-full bg-secondary-container/20 px-2 py-0.5 text-xs font-medium text-secondary">
              {dayNames[weekday]}
            </span>
          </div>
          <p className="text-sm font-medium text-primary">{suggested.name}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {suggested.exercises.slice(0, 4).map((ex) => (
              <span key={ex.id} className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary">
                {ex.exercises?.name}
              </span>
            ))}
            {suggested.exercises.length > 4 && (
              <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary">
                +{suggested.exercises.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {showStart && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Session</h2>
          <div>
            <label className="mb-1 block font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-border bg-surface-elevated px-3 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">Template</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTemplate('ad-hoc')}
                className={`w-full min-h-[44px] rounded-lg border px-3 text-sm text-left ${
                  selectedTemplate === 'ad-hoc'
                    ? 'border-primary bg-primary-container/10 text-primary font-medium'
                    : 'border-border bg-surface-elevated'
                }`}
              >
                Ad-hoc (no template)
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`w-full min-h-[44px] rounded-lg border px-3 text-sm text-left ${
                    selectedTemplate === t.id
                      ? 'border-primary bg-primary-container/10 text-primary font-medium'
                      : 'border-border bg-surface-elevated'
                  }`}
                >
                  {t.name}
                  {t.scheduled_weekday !== null && (
                    <span className="ml-2 text-xs text-text-secondary">({dayNames[t.scheduled_weekday]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStartSession}
              disabled={starting}
              className="flex-1 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {starting ? 'Starting...' : 'Start'}
            </button>
            <button
              onClick={() => setShowStart(false)}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div>
          <h2 className="mb-2 font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">Recent Sessions</h2>
          <div className="space-y-1">
            {recentSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/gym/${s.id}`)}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left"
              >
                <Dumbbell className="h-4 w-4 text-text-secondary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{s.session_date}</p>
                  {s.notes && <p className="text-xs text-text-secondary">{s.notes}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentSessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Dumbbell className="mx-auto h-8 w-8 text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">No sessions yet. Start your first workout!</p>
        </div>
      )}
    </div>
  )
}