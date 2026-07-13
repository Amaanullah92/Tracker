'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Exercise } from '@/lib/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true)
      .order('muscle_group')
      .order('name')
    if (data) setExercises(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(form: FormData) {
    const name = form.get('name') as string
    const muscleGroup = form.get('muscle_group') as string
    const rest = form.get('default_rest_seconds') as string

    const payload = {
      name,
      muscle_group: muscleGroup || null,
      default_rest_seconds: rest ? parseInt(rest) : null,
    }

    let error: { message: string } | null = null

    if (editing) {
      const res = await supabase.from('exercises').update(payload).eq('id', editing.id)
      error = res.error
    } else {
      const res = await supabase.from('exercises').insert(payload)
      error = res.error
    }

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(editing ? 'Exercise updated' : 'Exercise created')
    setEditing(null)
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('exercises').update({ is_active: false }).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Exercise deleted')
    load()
  }

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, e) => {
    const key = e.muscle_group ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-[480px] px-margin-x space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-text-primary">Exercise Library</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {showForm && (
        <form action={handleSave} className="rounded-xl bg-surface p-4 space-y-3">
          <input
            name="name"
            defaultValue={editing?.name ?? ''}
            placeholder="Exercise name"
            className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <select
            name="muscle_group"
            defaultValue={editing?.muscle_group ?? ''}
            className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select muscle group</option>
            {['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <input
            name="default_rest_seconds"
            type="number"
            defaultValue={editing?.default_rest_seconds ?? ''}
            placeholder="Default rest (seconds)"
            className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : (
        Object.entries(grouped).map(([group, exs]) => (
          <div key={group}>
            <h2 className="mb-2 text-xs font-semibold uppercase text-text-secondary">{group}</h2>
            <div className="space-y-1">
              {exs.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    {ex.default_rest_seconds && (
                      <p className="text-xs text-text-secondary">{ex.default_rest_seconds}s rest</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(ex); setShowForm(true) }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}