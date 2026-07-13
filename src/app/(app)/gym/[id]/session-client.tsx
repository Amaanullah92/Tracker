'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Timer, Play, Pause, Check, X, SkipForward } from 'lucide-react'

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

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  async function handleAddExercise(exerciseId: string) {
    const maxOrder = exercises.length
    const { data: se } = await supabase
      .from('session_exercises')
      .insert({
        session_id: session.id,
        exercise_id: exerciseId,
        sort_order: maxOrder,
      })
      .select('*, exercises(name, muscle_group, default_rest_seconds)')
      .single()

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
      console.error('Failed to save sets atomically:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      setSaving(false)
      return
    }

    if (notes !== session.notes) {
      await supabase.from('workout_sessions').update({ notes }).eq('id', session.id)
    }

    setSaving(false)
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

  return (
    <>
    <div className="mx-auto max-w-[480px] space-y-3 p-4 pb-24">
      <div>
        <h1 className="text-lg font-bold">{session.session_date}</h1>
        <p className="text-xs text-text-secondary">
          {session.workout_day_id ? 'Template session' : 'Ad-hoc session'}
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Session notes..."
        rows={2}
        className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary resize-none"
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
        <div key={groupId} className="relative rounded-xl border border-dashed border-primary p-base">
          <div className="absolute -top-3 left-4 bg-bg px-2">
            <span className="font-mono text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 px-2 py-1 rounded">
              SUPERSET
            </span>
          </div>
          <div className="space-y-gutter mt-3">
            {group.map((ex) => (
              <div key={ex.id}>
                <p className="mb-2 text-sm font-semibold">{ex.exercises?.name}</p>
                <SetInputPanel
                  sets={sets[ex.id] ?? []}
                  newSetValues={newSetValues[ex.id] ?? { weight: '', reps: '' }}
                  prefill={prefill[ex.id] ?? []}
                  timer={timer}
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

      {showAddExercise && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Add Exercise</h2>
            <button onClick={() => setShowAddExercise(false)} className="text-text-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
          {(available.length === 0 ? [{ id: 'search', name: 'Search exercise library', muscle_group: null }] : available).map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleAddExercise(ex.id)}
              className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-surface-elevated"
            >
              {ex.name}
              {ex.muscle_group && <span className="ml-2 text-xs text-text-secondary">{ex.muscle_group}</span>}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddExercise(true)}
        className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-3 text-sm text-text-secondary hover:bg-surface-elevated"
      >
        <Plus className="h-4 w-4" /> Add Exercise
      </button>
    </div>

    <div className="fixed bottom-16 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 bg-bg/90 px-4 py-3 shadow-[0_-12px_12px_rgba(0,0,0,0.4)] backdrop-blur-sm">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary-container text-sm font-bold text-white disabled:opacity-40"
      >
        {saving ? 'Saving...' : 'Finish & Save'}
      </button>
    </div>
  </> )
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
    <div className="rounded-lg bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{exercise.exercises?.name}</h2>
          {exercise.exercises?.muscle_group && (
            <p className="text-xs text-text-secondary">{exercise.exercises.muscle_group}</p>
          )}
        </div>
      </div>

      <SetInputPanel
        sets={sets}
        newSetValues={newSetValues}
        prefill={prefill}
        timer={timer}
        onNewSetChange={onNewSetChange}
        onAddSet={onAddSet}
        onDeleteSet={onDeleteSet}
      />

      {isThisExercise && timer.remaining > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Timer className="h-4 w-4 text-tertiary" />

          {editingTimer === exercise.id ? (
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') onSetEditingTimer(null) }}
              className="w-20 rounded-lg border border-border bg-surface-elevated px-2 py-1 text-sm font-mono text-tertiary"
              autoFocus
              min={1}
            />
          ) : (
            <button
              onClick={handleEditStart}
              className={`rounded-lg px-2 py-1 text-sm font-mono transition-colors hover:bg-surface-elevated ${
                timer.running ? 'text-tertiary' : 'text-text-secondary'
              }`}
              title="Tap to edit"
            >
              {Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, '0')}
            </button>
          )}

          <button
            onClick={() => onAdjustTimer(-15)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-elevated"
            title="-15s"
          >
            -15
          </button>

          <button
            onClick={timer.running ? onStopTimer : () => onStartTimer(timer.remaining > 0 ? timer.remaining : timer.total)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-elevated"
          >
            {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={() => onAdjustTimer(15)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-elevated"
            title="+15s"
          >
            +15
          </button>

          <button
            onClick={onSkipTimer}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-text-secondary hover:text-destructive"
            title="Skip rest"
          >
            <SkipForward className="h-3.5 w-3.5" /> Skip
          </button>
        </div>
      )}
    </div>
  )
}

function SetInputPanel({
  sets,
  newSetValues,
  prefill,
  timer,
  onNewSetChange,
  onAddSet,
  onDeleteSet,
}: {
  sets: Set[]
  newSetValues: { weight: string; reps: string }
  prefill: { weight: string; reps: string }[]
  timer: { exerciseId: string | null; remaining: number; total: number; running: boolean }
  onNewSetChange: (vals: { weight: string; reps: string }) => void
  onAddSet: () => void
  onDeleteSet: (setId: string) => void
}) {
  return (
    <div>
      {sets.length > 0 && (
        <div className="mb-2 space-y-2">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-2 font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">
            <span className="text-center">SET</span>
            <span className="text-center">KG</span>
            <span className="text-center">REPS</span>
            <span></span>
          </div>
          {sets.map((set) => (
            <div key={set.id} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center px-2 py-1">
              <span className="text-center text-sm text-text-secondary">{set.set_number}</span>
              <span className="text-center text-sm text-text-primary">{set.weight_kg}</span>
              <span className="text-center text-sm text-text-primary">{set.reps}</span>
              <div className="flex justify-center">
                <button onClick={() => onDeleteSet(set.id)} className="text-text-secondary hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sets.length === 0 && prefill.length > 0 && (
        <div className="mb-2 rounded-lg bg-surface-elevated/50 p-2">
          <p className="mb-1 text-xs text-text-secondary">Last session:</p>
          <div className="space-y-0.5">
            {prefill.map((p, i) => (
              <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr] gap-1 text-xs text-text-secondary">
                <span>{i + 1}</span>
                <span>{p.weight} kg</span>
                <span>{p.reps} reps</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center bg-surface-elevated p-2 rounded-lg">
        <span className="text-center text-sm text-text-secondary">{sets.length + 1}</span>
        <input
          type="number"
          step="0.5"
          value={newSetValues.weight}
          onChange={(e) =>
            onNewSetChange({ ...newSetValues, weight: e.target.value })
          }
          placeholder="KG"
          className="w-full bg-surface text-center text-sm text-text-primary border-none rounded min-h-[44px] focus:ring-1 focus:ring-primary-container appearance-none p-0"
        />
        <input
          type="number"
          value={newSetValues.reps}
          onChange={(e) =>
            onNewSetChange({ ...newSetValues, reps: e.target.value })
          }
          placeholder="REPS"
          className="w-full bg-surface text-center text-sm text-text-primary border-none rounded min-h-[44px] focus:ring-1 focus:ring-primary-container appearance-none p-0"
        />
        <div className="flex justify-center">
          <button
            onClick={onAddSet}
            disabled={!newSetValues.weight || !newSetValues.reps}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}