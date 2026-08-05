'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Exercise } from '@/lib/types'
import { Plus, Pencil, Trash2, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/ui/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core']

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

  useEffect(() => {
    let ignore = false
    async function start() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('muscle_group')
        .order('name')
      if (ignore) return
      if (data) setExercises(data)
      setLoading(false)
    }
    start()
    return () => { ignore = true }
  }, [])

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

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? It will be hidden from new sessions.`)) return
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
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        back
        title="Exercise Library"
        eyebrow="Custom movements"
        right={
          <Button onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />

      {showForm && (
        <form action={handleSave} className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <Input
            name="name"
            label="Exercise Name"
            defaultValue={editing?.name ?? ''}
            placeholder="e.g. Barbell Bench Press"
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="muscle_group" className="block font-mono text-label text-label uppercase text-text-secondary">
              Muscle Group
            </label>
            <select
              id="muscle_group"
              name="muscle_group"
              defaultValue={editing?.muscle_group ?? ''}
              className="ring-focus h-12 w-full rounded-lg border border-border bg-surface-elevated px-3 text-body text-text-primary outline-none"
            >
              <option value="">Select muscle group</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <Input
            name="default_rest_seconds"
            label="Default Rest"
            type="number"
            defaultValue={editing?.default_rest_seconds ?? ''}
            placeholder="Seconds, e.g. 90"
            helper="Rest timer used between sets in a session."
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">
              {editing ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : exercises.length === 0 && !showForm ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Build your movement library — they power workout sessions and templates."
          action={
            <Button onClick={() => { setEditing(null); setShowForm(true) }}>
              <Plus className="h-4 w-4" /> Add Exercise
            </Button>
          }
        />
      ) : (
        Object.entries(grouped).map(([group, exs]) => (
          <div key={group}>
            <h2 className="mb-2 px-1 font-mono text-label text-label uppercase text-text-tertiary">
              {group}
            </h2>
            <div className="space-y-1.5">
              {exs.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{ex.name}</p>
                    {ex.default_rest_seconds && (
                      <p className="font-mono text-xs text-text-secondary">{ex.default_rest_seconds}s rest</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => { setEditing(ex); setShowForm(true) }}
                      aria-label={`Edit ${ex.name}`}
                      className="ring-focus press flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id, ex.name)}
                      aria-label={`Delete ${ex.name}`}
                      className="ring-focus press flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-destructive/10 hover:text-destructive"
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
