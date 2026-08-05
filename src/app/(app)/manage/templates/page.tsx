'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkoutDay, WorkoutDayExercise, Exercise } from '@/lib/types'
import { Plus, X, CalendarDays, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/ui/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<(WorkoutDay & { exercises: (WorkoutDayExercise & { name?: string })[] })[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: tpls } = await supabase
      .from('workout_days')
      .select('*')
      .order('sort_order')
    if (!tpls) return

    const { data: wde } = await supabase
      .from('workout_day_exercises')
      .select('*')
      .order('sort_order')
    if (!wde) return

    const { data: exs } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (exs) setExercises(exs)

    const exMap = new Map(exs?.map((e) => [e.id, e.name]) ?? [])

    setTemplates(
      tpls.map((t) => ({
        ...t,
        exercises: (wde.filter((w) => w.workout_day_id === t.id)).map((w) => ({
          ...w,
          name: exMap.get(w.exercise_id) ?? 'Unknown',
        })),
      })),
    )
  }

  useEffect(() => {
    let ignore = false
    async function start() {
      const { data: tpls } = await supabase
        .from('workout_days')
        .select('*')
        .order('sort_order')
      if (ignore || !tpls) return

      const { data: wde } = await supabase
        .from('workout_day_exercises')
        .select('*')
        .order('sort_order')
      if (ignore || !wde) return

      const { data: exs } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (ignore) return
      if (exs) setExercises(exs)

      const exMap = new Map(exs?.map((e) => [e.id, e.name]) ?? [])

      setTemplates(
        tpls.map((t) => ({
          ...t,
          exercises: (wde.filter((w) => w.workout_day_id === t.id)).map((w) => ({
            ...w,
            name: exMap.get(w.exercise_id) ?? 'Unknown',
          })),
        })),
      )
    }
    start()
    return () => { ignore = true }
  }, [])

  async function handleCreateName(form: FormData) {
    const name = form.get('name') as string
    const weekday = form.get('weekday') as string
    const { error } = await supabase.from('workout_days').insert({
      name,
      scheduled_weekday: weekday ? parseInt(weekday) : null,
      sort_order: templates.length + 1,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Template created')
    setShowForm(false)
    load()
  }

  async function handleDeleteTemplate(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? Sessions already logged are kept.`)) return
    const { error } = await supabase.from('workout_days').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Template deleted')
    load()
  }

  async function handleAddExercise(templateId: string, exerciseId: string) {
    const tpl = templates.find((t) => t.id === templateId)
    const maxOrder = tpl ? tpl.exercises.length : 0
    const { error } = await supabase.from('workout_day_exercises').insert({
      workout_day_id: templateId,
      exercise_id: exerciseId,
      sort_order: maxOrder,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Exercise added')
    load()
  }

  async function handleRemoveExercise(id: string, name: string) {
    const { error } = await supabase.from('workout_day_exercises').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${name} removed`)
    load()
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        back
        title="Workout Templates"
        eyebrow="Training splits"
        right={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      {showForm && (
        <form action={handleCreateName} className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <Input
            name="name"
            label="Template Name"
            placeholder="e.g. Push Day"
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="weekday" className="block font-mono text-label text-label uppercase text-text-secondary">
              Scheduled Day
            </label>
            <select
              id="weekday"
              name="weekday"
              defaultValue=""
              className="ring-focus h-12 w-full rounded-lg border border-border bg-surface-elevated px-3 text-body text-text-primary outline-none"
            >
              <option value="">No fixed day</option>
              {WEEKDAYS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">Create</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {templates.length === 0 && (
        <EmptyState
          icon={Dumbbell}
          title="No templates yet"
          description="Create a split to pre-fill your gym sessions in one tap."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> New Template
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-border p-4 pb-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-headline-md font-semibold text-text-primary">
                  {tpl.name}
                </h2>
                {tpl.scheduled_weekday !== null && (
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-text-secondary">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {WEEKDAYS[tpl.scheduled_weekday]}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                className="ring-focus press rounded-lg px-2 py-2 text-sm font-medium text-text-tertiary hover:text-destructive"
              >
                Delete
              </button>
            </div>

            <div className="space-y-1.5 p-3">
              {tpl.exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono text-label text-label text-text-tertiary">
                      {String(tpl.exercises.indexOf(ex) + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-body text-text-primary">{ex.name}</span>
                    {ex.superset_group_id && (
                      <span className="shrink-0 rounded-sm bg-primary-container/30 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-primary-fixed">
                        superset
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(ex.id, ex.name ?? 'Unknown')}
                    aria-label={`Remove ${ex.name}`}
                    className="ring-focus press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {exercises
                  .filter((e) => !tpl.exercises.some((te) => te.exercise_id === e.id))
                  .slice(0, 6)
                  .map((e) => (
                    <button
                      key={e.id}
                      onClick={() => handleAddExercise(tpl.id, e.id)}
                      className="ring-focus press rounded-md border border-dashed border-border px-2.5 py-2 text-xs text-text-secondary hover:border-primary/50 hover:bg-primary/10 hover:text-primary-fixed"
                    >
                      + {e.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
