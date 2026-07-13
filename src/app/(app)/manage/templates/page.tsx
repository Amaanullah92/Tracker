'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkoutDay, WorkoutDayExercise, Exercise } from '@/lib/types'
import { Plus, Pencil, GripVertical, X } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<(WorkoutDay & { exercises: (WorkoutDayExercise & { name?: string })[] })[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [editing, setEditing] = useState<string | null>(null)
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

  useEffect(() => { load() }, [])

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

  async function handleDeleteTemplate(id: string) {
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

  async function handleRemoveExercise(id: string) {
    const { error } = await supabase.from('workout_day_exercises').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Exercise removed')
    load()
  }

  return (
    <div className="mx-auto max-w-[480px] px-margin-x space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-text-primary">Workout Templates</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {showForm && (
        <form action={handleCreateName} className="rounded-xl bg-surface p-4 space-y-3">
          <input
            name="name"
            placeholder="Template name"
            className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
            required
          />
          <select name="weekday" className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">No fixed day</option>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {templates.map((tpl) => (
        <div key={tpl.id} className="rounded-xl bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{tpl.name}</h2>
              {tpl.scheduled_weekday !== null && (
                <p className="text-xs text-text-secondary">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][tpl.scheduled_weekday]}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDeleteTemplate(tpl.id)}
              className="text-xs text-destructive"
            >
              Delete
            </button>
          </div>

          <div className="space-y-1">
            {tpl.exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-text-secondary" />
                  <span className="text-xs text-text-secondary">{i + 1}.</span>
                  <span className="text-sm">{ex.name}</span>
                  {ex.superset_group_id && (
                    <span className="text-xs text-primary">superset</span>
                  )}
                </div>
                <button onClick={() => handleRemoveExercise(ex.id)} className="text-text-secondary hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-1.5 flex-wrap">
            {exercises
              .filter((e) => !tpl.exercises.some((te) => te.exercise_id === e.id))
              .slice(0, 5)
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleAddExercise(tpl.id, e.id)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-background"
                >
                  + {e.name}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}