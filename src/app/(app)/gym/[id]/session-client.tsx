'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Timer, Play, Pause, Check, SkipForward, Dumbbell, Search } from 'lucide-react'
import { toast } from 'sonner'
import { shouldQueue } from '@/lib/offline'
import { enqueue } from '@/lib/db-queue'
import { AppHeader } from '@/components/ui/app-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet } from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'

type SessionExerciseWithDetails = {
  id: string
  session_id: string
  exercise_id: string
  sort_order: number
  rest_seconds: number | null
  superset_group_id: string | null
  exercises: {
    name: string
    muscle_group: string | null
    default_rest_seconds: number | null
  } | null
}

type Set = {
  id: string
  session_exercise_id: string
  set_number: number
  weight_kg: number
  reps: number
  updated_at: string
}

export function SessionPageClient({
  session,
  sessionExercises: initialExercises,
  availableExercises: initialAvailable,
  allSets: initialSets,
}: {
  session: { id: string; session_date: string; notes: string | null; workout_day_id: string | null }
  sessionExercises: SessionExerciseWithDetails[]
  availableExercises: { id: string; name: string; muscle_group: string | null }[]
  allSets: Set[]
}) {
  const [exercises, setExercises] = useState(initialExercises)
  const [available, setAvailable] = useState(initialAvailable)
  const [sets, setSets] = useState<Record<string, Set[]>>(() => {
    const grouped: Record<string, Set[]> = {}
    for (const s of initialSets) {
      if (!grouped[s.session_exercise_id]) grouped[s.session_exercise_id] = []
      grouped[s.session_exercise_id].push(s)
    }
    return grouped
  })
  const [newSetValues, setNewSetValues] = useState<Record<string, { weight: string; reps: string }>>({})
  const [prefill, setPrefill] = useState<Record<string, { weight: string; reps: string }[]>>({})
  const [timer, setTimer] = useState<{
    exerciseId: string | null
    remaining: number
    total: number
    running: boolean
  }>({ exerciseId: null, remaining: 0, total: 0, running: false })
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [notes, setNotes] = useState(session.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [editingTimer, setEditingTimer] = useState<string | null>(null)
  const [exerciseFilter, setExerciseFilter] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Prefill: show last session's sets for each exercise
  useEffect(() => {
    async function loadPrefill() {
      for (const ex of exercises) {
        const { data: prevEx } = await supabase
          .from('session_exercises')
          .select('id')
          .eq('exercise_id', ex.exercise_id)
          .neq('session_id', session.id)
          .order('session_id', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!prevEx) continue

        const { data: prevSets } = await supabase
          .from('sets')
          .select('weight_kg, reps')
          .eq('session_exercise_id', prevEx.id)
          .order('set_number')

        if (prevSets && prevSets.length > 0) {
          setPrefill((prev) => ({
            ...prev,
            [ex.id]: prevSets.map((s) => ({
              weight: s.weight_kg.toString(),
              reps: s.reps.toString(),
            })),
          }))
        }
      }
    }
    loadPrefill()
  }, [])

  function addSet(sessionExerciseId: string) {
    const vals = newSetValues[sessionExerciseId]
    if (!vals || !vals.weight || !vals.reps) return

    const currentSets = sets[sessionExerciseId] ?? []
    const newSet: Set = {
      id: crypto.randomUUID(),
      session_exercise_id: sessionExerciseId,
      set_number: currentSets.length + 1,
      weight_kg: parseFloat(vals.weight),
      reps: parseInt(vals.reps),
      updated_at: '',
    }

    setSets((prev) => ({
      ...prev,
      [sessionExerciseId]: [...(prev[sessionExerciseId] ?? []), newSet],
    }))
    setNewSetValues((prev) => ({ ...prev, [sessionExerciseId]: { weight: '', reps: '' } }))

    // Start rest timer
    const ex = exercises.find((e) => e.id === sessionExerciseId)
    const rest = ex?.rest_seconds ?? ex?.exercises?.default_rest_seconds ?? 90
    setTimer({ exerciseId: sessionExerciseId, remaining: rest, total: rest, running: true })
  }

  function deleteSet(sessionExerciseId: string, setId: string) {
    setSets((prev) => ({
      ...prev,
      [sessionExerciseId]: (prev[sessionExerciseId] ?? []).filter((s) => s.id !== setId),
    }))
  }

  // Timer countdown
  useEffect(() => {
    if (!timer.running || timer.remaining <= 0) return
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.remaining <= 1) {
          return { ...prev, remaining: 0, running: false }
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timer.running, timer.exerciseId])

  function skipTimer() {
    setTimer({ exerciseId: null, remaining: 0, total: 0, running: false })
  }

  function adjustTimer(delta: number) {
    setTimer((prev) => {
      const next = Math.max(0, prev.remaining + delta)
      return { ...prev, remaining: next, total: Math.max(next, prev.total) }
    })
  }

  function setTimerRemaining(seconds: number) {
    setTimer((prev) => ({
      ...prev,
      remaining: Math.max(0, seconds),
      total: Math.max(Math.max(0, seconds), prev.total),
    }))
  }

  async function handleAddExercise(exerciseId: string) {
    const maxOrder = exercises.length
    const { data: se, error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: session.id,
        exercise_id: exerciseId,
        sort_order: maxOrder,
      })
      .select('*, exercises(name, muscle_group, default_rest_seconds)')
      .single()

    if (error) {
      toast.error(error.message)
      return
    }

    if (se) {
      setExercises((prev) => [...prev, se])
      setAvailable((prev) => prev.filter((e) => e.id !== exerciseId))
    }
  }

  async function handleSave() {
    setSaving(true)

    const allSets: { session_exercise_id: string; set_number: number; weight_kg: number; reps: number }[] = []
    for (const seId of exercises.map((e) => e.id)) {
      for (const set of sets[seId] ?? []) {
        allSets.push({
          session_exercise_id: seId,
          set_number: set.set_number,
          weight_kg: set.weight_kg,
          reps: set.reps,
        })
      }
    }

    // Atomic save via Postgres function (delete + insert in single transaction)
    const { error } = await supabase.rpc('set_session_sets', {
      p_session_id: session.id,
      p_sets: allSets,
    })

    if (error) {
      if (shouldQueue(error)) {
        const baseVersion: string | null | 'UNKNOWN' = initialSets.length > 0
          ? initialSets.reduce<string | null>((latest, s) => !latest || s.updated_at > latest ? s.updated_at : latest, null)
          : 'UNKNOWN'
        await enqueue({
          type: 'gym_set',
          action: 'upsert',
          payload: { p_session_id: session.id, p_sets: allSets },
          targetKey: { session_id: session.id },
          baseVersion,
        })
        setSaving(false)
        toast.info('Session saved offline')
        return
      }

      console.error('Failed to save sets atomically:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      toast.error(error.message)
      setSaving(false)
      return
    }

    if (notes !== session.notes) {
      await supabase.from('workout_sessions').update({ notes }).eq('id', session.id)
    }

    setSaving(false)
    toast.success('Session saved')
    router.refresh()
  }

  // Group exercises by superset
  const supersetGroups: Record<string, typeof exercises> = {}
  const standalone: typeof exercises = []
  for (const ex of exercises) {
    if (ex.superset_group_id) {
      if (!supersetGroups[ex.superset_group_id]) supersetGroups[ex.superset_group_id] = []
      supersetGroups[ex.superset_group_id].push(ex)
    } else {
      standalone.push(ex)
    }
  }

  const filteredAvailable = useMemo(() => {
    const q = exerciseFilter.trim().toLowerCase()
    if (!q) return available
    return available.filter((ex) => ex.name.toLowerCase().includes(q))
  }, [available, exerciseFilter])

  return (
    <>
      <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-28">
        <AppHeader
          back
          title={session.session_date}
          eyebrow={session.workout_day_id ? 'Template Session' : 'Ad-hoc Session'}
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Session notes — pumps, fatigue, anything…"
          rows={2}
          className="ring-focus w-full resize-none rounded-lg border border-border bg-surface-elevated px-4 py-3 text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />

        {standalone.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            sets={sets[ex.id] ?? []}
            newSetValues={newSetValues[ex.id] ?? { weight: '', reps: '' }}
            prefill={prefill[ex.id] ?? []}
            timer={timer}
            editingTimer={editingTimer}
            onNewSetChange={(vals) =>
              setNewSetValues((prev) => ({ ...prev, [ex.id]: vals }))
            }
            onAddSet={() => addSet(ex.id)}
            onDeleteSet={(setId) => deleteSet(ex.id, setId)}
            onStartTimer={(seconds) =>
              setTimer({ exerciseId: ex.id, remaining: seconds, total: seconds, running: true })
            }
            onStopTimer={() =>
              setTimer((prev) => ({ ...prev, running: false }))
            }
            onSkipTimer={skipTimer}
            onAdjustTimer={adjustTimer}
            onSetTimerRemaining={setTimerRemaining}
            onSetEditingTimer={setEditingTimer}
          />
        ))}

        {Object.entries(supersetGroups).map(([groupId, group]) => (
          <div
            key={groupId}
            className="relative rounded-lg border border-dashed border-primary bg-surface p-4"
          >
            <div className="absolute -top-3 left-4 bg-bg px-1.5">
              <Badge tone="ember" mono>
                Superset
              </Badge>
            </div>
            <div className="mt-2 space-y-4">
              {group.map((ex) => (
                <div key={ex.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-headline text-headline text-text-primary">
                      {ex.exercises?.name}
                    </h2>
                    {ex.exercises?.muscle_group && (
                      <Badge>{ex.exercises.muscle_group}</Badge>
                    )}
                  </div>
                  <SetInputPanel
                    sets={sets[ex.id] ?? []}
                    newSetValues={newSetValues[ex.id] ?? { weight: '', reps: '' }}
                    prefill={prefill[ex.id] ?? []}
                    onNewSetChange={(vals) =>
                      setNewSetValues((prev) => ({ ...prev, [ex.id]: vals }))
                    }
                    onAddSet={() => addSet(ex.id)}
                    onDeleteSet={(setId) => deleteSet(ex.id, setId)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={() => setShowAddExercise(true)}
          className="w-full py-4"
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </Button>
      </div>

      {/* Finish & save bar */}
      <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 py-3">
        <Button
          onClick={handleSave}
          size="lg"
          loading={saving}
          className="w-full shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
        >
          <Check className="h-5 w-5" /> {saving ? 'Saving…' : 'Finish & Save'}
        </Button>
      </div>

      {/* Add exercise sheet */}
      <Sheet
        open={showAddExercise}
        onClose={() => {
          setShowAddExercise(false)
          setExerciseFilter('')
        }}
        title="Add Exercise"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
            <input
              type="search"
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              placeholder="Search exercises…"
              className="ring-focus h-12 w-full rounded-lg border border-border bg-surface-elevated pl-11 pr-4 text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>

          {filteredAvailable.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title={available.length === 0 ? 'Library empty' : 'No matches'}
              description={
                available.length === 0
                  ? 'Add exercises to your library under Manage → Exercise Library.'
                  : 'Try a different search.'
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {filteredAvailable.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleAddExercise(ex.id)}
                  className="ring-focus press flex min-h-12 w-full items-center justify-between gap-2 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-text-primary">{ex.name}</span>
                    {ex.muscle_group && (
                      <span className="block text-xs text-text-secondary">{ex.muscle_group}</span>
                    )}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Sheet>
    </>
  )
}

function ExerciseCard({
  exercise,
  sets,
  newSetValues,
  prefill,
  timer,
  editingTimer,
  onNewSetChange,
  onAddSet,
  onDeleteSet,
  onStartTimer,
  onStopTimer,
  onSkipTimer,
  onAdjustTimer,
  onSetTimerRemaining,
  onSetEditingTimer,
}: {
  exercise: SessionExerciseWithDetails
  sets: Set[]
  newSetValues: { weight: string; reps: string }
  prefill: { weight: string; reps: string }[]
  timer: { exerciseId: string | null; remaining: number; total: number; running: boolean }
  editingTimer: string | null
  onNewSetChange: (vals: { weight: string; reps: string }) => void
  onAddSet: () => void
  onDeleteSet: (setId: string) => void
  onStartTimer: (seconds: number) => void
  onStopTimer: () => void
  onSkipTimer: () => void
  onAdjustTimer: (delta: number) => void
  onSetTimerRemaining: (seconds: number) => void
  onSetEditingTimer: (id: string | null) => void
}) {
  const isThisExercise = timer.exerciseId === exercise.id
  const [inputValue, setInputValue] = useState('')

  function handleEditStart() {
    onSetEditingTimer(exercise.id)
    setInputValue(String(timer.remaining))
  }

  function handleEditSubmit() {
    const parsed = parseInt(inputValue)
    if (!isNaN(parsed) && parsed > 0) {
      onSetTimerRemaining(parsed)
    }
    onSetEditingTimer(null)
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-headline text-headline text-text-primary">
          {exercise.exercises?.name}
        </h2>
        {exercise.exercises?.muscle_group && <Badge>{exercise.exercises.muscle_group}</Badge>}
      </div>

      <SetInputPanel
        sets={sets}
        newSetValues={newSetValues}
        prefill={prefill}
        onNewSetChange={onNewSetChange}
        onAddSet={onAddSet}
        onDeleteSet={onDeleteSet}
      />

      {isThisExercise && timer.remaining > 0 && (
        <div className="flex items-center justify-between gap-1 rounded-lg bg-surface-elevated px-2 py-1.5">
          <span className="flex items-center gap-1.5 pl-1.5 font-mono text-label text-label uppercase text-text-tertiary">
            <Timer className="h-4 w-4 text-tertiary" aria-hidden />
            Rest
          </span>

          {editingTimer === exercise.id ? (
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') onSetEditingTimer(null) }}
              className="ring-focus w-20 rounded-lg border border-border bg-surface px-2 py-1 font-mono text-lg text-tertiary outline-none"
              autoFocus
              min={1}
            />
          ) : (
            <button
              onClick={handleEditStart}
              className={`ring-focus press rounded-lg px-2 font-display text-2xl font-bold tabular-nums transition-colors ${
                timer.running ? 'text-tertiary' : 'text-text-secondary'
              }`}
              aria-label="Edit rest time"
            >
              {Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, '0')}
            </button>
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onAdjustTimer(-15)}
              className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-bright hover:text-text-primary"
              aria-label="Subtract 15 seconds"
            >
              -15
            </button>
            <button
              onClick={timer.running ? onStopTimer : () => onStartTimer(timer.remaining > 0 ? timer.remaining : timer.total)}
              className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-bright hover:text-text-primary"
              aria-label={timer.running ? 'Pause timer' : 'Start timer'}
            >
              {timer.running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onAdjustTimer(15)}
              className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-text-secondary hover:bg-surface-bright hover:text-text-primary"
              aria-label="Add 15 seconds"
            >
              +15
            </button>
            <button
              onClick={onSkipTimer}
              className="ring-focus press flex h-11 items-center gap-1 rounded-lg px-2 text-sm text-text-secondary hover:text-destructive"
              aria-label="Skip rest"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function SetInputPanel({
  sets,
  newSetValues,
  prefill,
  onNewSetChange,
  onAddSet,
  onDeleteSet,
}: {
  sets: Set[]
  newSetValues: { weight: string; reps: string }
  prefill: { weight: string; reps: string }[]
  onNewSetChange: (vals: { weight: string; reps: string }) => void
  onAddSet: () => void
  onDeleteSet: (setId: string) => void
}) {
  return (
    <div>
      {sets.length > 0 && (
        <div className="mb-2 space-y-1">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 px-2 font-mono text-label text-label uppercase text-text-tertiary">
            <span className="text-center">Set</span>
            <span className="text-center">Kg</span>
            <span className="text-center">Reps</span>
            <span aria-hidden />
          </div>
          {sets.map((set) => (
            <div
              key={set.id}
              className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg px-2 py-1"
            >
              <span className="text-center font-mono text-sm text-text-tertiary">{set.set_number}</span>
              <span className="text-center font-mono text-body font-medium tabular-nums text-text-primary">
                {set.weight_kg}
              </span>
              <span className="text-center font-mono text-body font-medium tabular-nums text-text-primary">
                {set.reps}
              </span>
              <div className="flex justify-center">
                <button
                  onClick={() => onDeleteSet(set.id)}
                  className="ring-focus press flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete set ${set.set_number}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sets.length === 0 && prefill.length > 0 && (
        <div className="mb-2 rounded-lg bg-surface-elevated/60 p-3">
          <p className="mb-1.5 font-mono text-label text-label uppercase text-text-tertiary">
            Last session
          </p>
          <div className="space-y-0.5">
            {prefill.map((p, i) => (
              <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr] gap-1 font-mono text-sm text-text-secondary">
                <span>{i + 1}</span>
                <span>{p.weight} kg</span>
                <span>{p.reps} reps</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg bg-surface-elevated p-2">
        <span className="text-center font-mono text-sm text-text-tertiary">{sets.length + 1}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={newSetValues.weight}
          onChange={(e) =>
            onNewSetChange({ ...newSetValues, weight: e.target.value })
          }
          placeholder="KG"
          aria-label="Weight in kg"
          className="h-11 w-full appearance-none rounded-md bg-surface text-center font-mono text-body text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-primary/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <input
          type="number"
          inputMode="numeric"
          value={newSetValues.reps}
          onChange={(e) =>
            onNewSetChange({ ...newSetValues, reps: e.target.value })
          }
          placeholder="REPS"
          aria-label="Reps"
          className="h-11 w-full appearance-none rounded-md bg-surface text-center font-mono text-body text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-primary/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <div className="flex justify-center">
          <button
            onClick={onAddSet}
            disabled={!newSetValues.weight || !newSetValues.reps}
            className="ring-focus press flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Add set"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
