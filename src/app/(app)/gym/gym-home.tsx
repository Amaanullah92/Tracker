'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Dumbbell, Plus, Scale, Flame, ChevronRight } from 'lucide-react'
import { pktDayOfWeek, formatDatePKT } from '@/lib/pkt-utils'
import { toast } from 'sonner'
import { shouldQueue, fetchBaseVersion } from '@/lib/offline'
import { enqueue } from '@/lib/db-queue'
import { AppHeader } from '@/components/ui/app-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stepper } from '@/components/ui/stepper'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'

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

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function GymHome({
  suggested,
  templates,
  recentSessions,
  today,
  userId,
  bodyWeightToday,
}: {
  suggested: WorkoutDayWithExercises | null
  templates: WorkoutDayWithExercises[]
  recentSessions: { id: string; session_date: string; notes: string | null }[]
  today: string
  userId: string
  bodyWeightToday: { id: string; weight_kg: number; updated_at: string } | null
}) {
  const [showStart, setShowStart] = useState(false)
  const [showWeight, setShowWeight] = useState(!bodyWeightToday)
  const [weight, setWeight] = useState(bodyWeightToday?.weight_kg?.toString() ?? '')
  const [selectedTemplate, setSelectedTemplate] = useState(suggested?.id ?? 'ad-hoc')
  const [sessionDate, setSessionDate] = useState(today)
  const [starting, setStarting] = useState(false)
  const [savingWeight, setSavingWeight] = useState(false)
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
      toast.error(error?.message ?? 'Failed to start session')
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
    setSavingWeight(true)

    const { error } = await supabase.from('body_weight_logs').upsert(
      { log_date: today, weight_kg: parseFloat(weight) },
      { onConflict: 'user_id, log_date' },
    )

    if (error) {
      if (shouldQueue(error)) {
        const baseVersion = await fetchBaseVersion(
          'body_weight_logs',
          { log_date: today },
        )
        await enqueue({
          type: 'body_weight',
          action: 'upsert',
          payload: { user_id: userId, log_date: today, weight_kg: parseFloat(weight) },
          targetKey: { log_date: today },
          baseVersion,
        })
        toast.info('Weight saved offline')
      } else {
        toast.error(error.message)
      }
      setSavingWeight(false)
      return
    }

    toast.success('Weight saved')
    setShowWeight(false)
    setSavingWeight(false)
    router.refresh()
  }

  const weekday = pktDayOfWeek(today)

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        title="Gym"
        eyebrow={formatDatePKT(today)}
        right={
          <Button size="md" onClick={() => setShowStart(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      {/* Suggested today */}
      {suggested && (
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-primary" />
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-mono text-label text-label uppercase text-text-tertiary">
                <Flame className="h-4 w-4 text-primary" aria-hidden />
                Suggested Today
              </span>
              <Badge tone="ember" mono>
                {dayNames[weekday]}
              </Badge>
            </div>
            <p className="font-display text-headline-lg text-headline-lg text-text-primary">
              {suggested.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggested.exercises.slice(0, 4).map((ex) => (
                <span
                  key={ex.id}
                  className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs text-text-secondary"
                >
                  {ex.exercises?.name}
                </span>
              ))}
              {suggested.exercises.length > 4 && (
                <span className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs text-text-secondary">
                  +{suggested.exercises.length - 4} more
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Body weight */}
      {showWeight && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display text-headline text-headline text-text-primary">
              <Scale className="h-4 w-4 text-text-tertiary" aria-hidden />
              Log Body Weight
            </span>
            <span className="font-mono text-label text-label uppercase text-text-tertiary">kg</span>
          </div>
          <Stepper
            label="Body weight (kg)"
            value={weight}
            onChange={setWeight}
            min={20}
            max={300}
            step={0.5}
          />
          <Button onClick={handleSaveWeight} loading={savingWeight} disabled={!weight} className="w-full">
            Save Weight
          </Button>
        </Card>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 ? (
        <div className="pt-1">
          <h2 className="mb-2 px-1 font-mono text-label text-label uppercase text-text-tertiary">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/gym/${s.id}`)}
                className="ring-focus press flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-outline"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-text-secondary">
                  <Dumbbell className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-text-primary">
                    {s.session_date}
                  </span>
                  {s.notes && (
                    <span className="block truncate text-sm text-text-secondary">{s.notes}</span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-outline" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <EmptyState
            icon={Dumbbell}
            title="No sessions yet"
            description="Start your first workout — it takes less than a minute."
            action={
              <Button onClick={() => setShowStart(true)}>
                <Plus className="h-4 w-4" /> Start Session
              </Button>
            }
          />
        </div>
      )}

      {/* New session sheet */}
      <Sheet
        open={showStart}
        onClose={() => setShowStart(false)}
        title="New Session"
        footer={
          <div className="flex gap-2">
            <Button
              onClick={handleStartSession}
              loading={starting}
              className="flex-1"
              size="lg"
            >
              {starting ? 'Starting…' : 'Start Workout'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowStart(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="session-date"
              className="block font-mono text-label text-label uppercase text-text-secondary"
            >
              Date
            </label>
            <input
              id="session-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="ring-focus h-12 w-full rounded-lg border border-border bg-surface-elevated px-4 text-body text-text-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block font-mono text-label text-label uppercase text-text-secondary">
              Template
            </span>
            <div className="space-y-1.5" role="radiogroup" aria-label="Workout template">
              <button
                type="button"
                role="radio"
                aria-checked={selectedTemplate === 'ad-hoc'}
                onClick={() => setSelectedTemplate('ad-hoc')}
                className={`ring-focus press flex min-h-12 w-full items-center justify-between rounded-lg border px-4 text-left transition-colors ${
                  selectedTemplate === 'ad-hoc'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-elevated'
                }`}
              >
                <span className={selectedTemplate === 'ad-hoc' ? 'font-semibold text-primary' : 'text-text-primary'}>
                  Ad-hoc
                </span>
                <span className="text-xs text-text-secondary">No template</span>
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedTemplate === t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`ring-focus press flex min-h-12 w-full items-center justify-between rounded-lg border px-4 text-left transition-colors ${
                    selectedTemplate === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface-elevated'
                  }`}
                >
                  <span className={selectedTemplate === t.id ? 'font-semibold text-primary' : 'text-text-primary'}>
                    {t.name}
                  </span>
                  {t.scheduled_weekday !== null && (
                    <span className="text-xs text-text-secondary">{dayNames[t.scheduled_weekday]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
