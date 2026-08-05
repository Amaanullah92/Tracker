'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FieldSchema, Habit } from '@/lib/types'
import { Plus, Pencil, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/ui/app-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { EmptyState } from '@/components/ui/empty-state'

export default function ManageHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order')
    if (data) setHabits(data)
  }

  useEffect(() => {
    let ignore = false
    async function start() {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order')
      if (ignore || !data) return
      setHabits(data)
    }
    start()
    return () => { ignore = true }
  }, [])

  async function handleCreate(form: FormData) {
    const name = form.get('name') as string
    const desc = form.get('description') as string
    const sortOrder = parseInt(form.get('sort_order') as string) || habits.length + 1
    const completionField = (form.get('completion_field') as string) || null
    const completionValue = (form.get('completion_value') as string) || null
    const streakDirection = (form.get('streak_direction') as string) as 'positive' | 'inverse'

    let schema: FieldSchema
    try {
      schema = JSON.parse(form.get('field_schema') as string)
    } catch {
      return
    }

    const { error } = await supabase.from('habits').insert({
      name,
      description: desc || null,
      field_schema: schema,
      completion_field: completionField,
      completion_value: completionValue,
      streak_direction: streakDirection,
      is_active: true,
      sort_order: sortOrder,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Habit created')
    setShowCreate(false)
    load()
  }

  async function handleUpdate(id: string, form: FormData) {
    const name = form.get('name') as string

    let schema: FieldSchema
    try {
      schema = JSON.parse(form.get('field_schema') as string)
    } catch {
      return
    }

    const { error } = await supabase.from('habits').update({
      name,
      description: (form.get('description') as string) || null,
      field_schema: schema,
      completion_field: (form.get('completion_field') as string) || null,
      completion_value: (form.get('completion_value') as string) || null,
      streak_direction: form.get('streak_direction') as 'positive' | 'inverse',
      is_active: form.get('is_active') === 'on',
      sort_order: parseInt(form.get('sort_order') as string) || 1,
    }).eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Habit updated')
    setEditingId(null)
    load()
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This removes its history too.`)) return
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Habit deleted')
    load()
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        back
        title="Habits"
        eyebrow="Trackers & rules"
        right={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      {showCreate && (
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitLabel="Create Habit"
        />
      )}

      {habits.length === 0 && !showCreate && (
        <EmptyState
          icon={Plus}
          title="No habits yet"
          description="Create your first tracker — toggle, number, or select fields."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Habit
            </Button>
          }
        />
      )}

      {habits.map((habit) => {
        if (editingId === habit.id) {
          return (
            <HabitForm
              key={habit.id}
              habit={habit}
              onSubmit={(f) => handleUpdate(habit.id, f)}
              onCancel={() => setEditingId(null)}
              submitLabel="Save Changes"
            />
          )
        }

        return (
          <Card key={habit.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-headline text-headline text-text-primary">
                  {habit.name}
                </h2>
                {habit.description && (
                  <p className="mt-0.5 text-sm text-text-secondary">{habit.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge mono>
                    {habit.streak_direction === 'inverse' ? 'Inverse' : 'Positive'}
                  </Badge>
                  {habit.completion_field && (
                    <Badge mono tone="ember">
                      {habit.completion_field}={habit.completion_value ?? 'on'}
                    </Badge>
                  )}
                  {!habit.is_active && (
                    <Badge tone="danger">Inactive</Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => setEditingId(habit.id)}
                  aria-label={`Edit ${habit.name}`}
                  className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(habit.id, habit.name)}
                  aria-label={`Delete ${habit.name}`}
                  className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

const TYPE_OPTIONS = [
  { value: 'toggle', label: 'Toggle' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'text', label: 'Text' },
  { value: 'time', label: 'Time' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((t) => [t.value, t.label]),
)

function HabitForm({
  habit,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  habit?: Habit
  onSubmit: (form: FormData) => void
  onCancel: () => void
  submitLabel: string
}) {
  const [fields, setFields] = useState<FieldSchema>(habit?.field_schema ?? [])
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
  const [editorLabel, setEditorLabel] = useState('')
  const [editorType, setEditorType] = useState<FieldSchema[0]['type']>('toggle')
  const [editorOptions, setEditorOptions] = useState<string[]>([])
  const [editorOptionInput, setEditorOptionInput] = useState('')

  const hiddenSchemaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hiddenSchemaRef.current) {
      hiddenSchemaRef.current.value = JSON.stringify(fields)
    }
  }, [fields])

  function openNewFieldEditor() {
    setEditingFieldIndex(null)
    setEditorLabel('')
    setEditorType('toggle')
    setEditorOptions([])
    setEditorOptionInput('')
    setShowFieldEditor(true)
  }

  function openEditFieldEditor(index: number) {
    const f = fields[index]
    setEditorLabel(f.label)
    setEditorType(f.type)
    setEditorOptions(f.options ?? [])
    setEditorOptionInput('')
    setEditingFieldIndex(index)
    setShowFieldEditor(true)
  }

  function closeEditor() {
    setShowFieldEditor(false)
    setEditingFieldIndex(null)
  }

  function saveField() {
    const trimmed = editorLabel.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const field: FieldSchema[0] = { key, label: trimmed, type: editorType }
    if (editorType === 'select') {
      field.options = [...editorOptions]
    }
    if (editingFieldIndex !== null) {
      const updated = [...fields]
      updated[editingFieldIndex] = field
      setFields(updated)
    } else {
      setFields([...fields, field])
    }
    closeEditor()
  }

  function deleteField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
    if (editingFieldIndex === index) closeEditor()
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= fields.length) return
    const updated = [...fields]
    const [moved] = updated.splice(index, 1)
    updated.splice(target, 0, moved)
    setFields(updated)
  }

  function addOption() {
    const v = editorOptionInput.trim()
    if (!v || editorOptions.includes(v)) return
    setEditorOptions([...editorOptions, v])
    setEditorOptionInput('')
  }

  function removeOption(opt: string) {
    setEditorOptions(editorOptions.filter((o) => o !== opt))
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <input ref={hiddenSchemaRef} name="field_schema" type="hidden" defaultValue={JSON.stringify(fields)} />

      <Input
        name="name"
        label="Habit Name"
        defaultValue={habit?.name}
        placeholder="e.g. Read 20 pages"
        required
      />

      <Input
        name="description"
        label="Description"
        defaultValue={habit?.description ?? ''}
        placeholder="Optional — what does this habit look like?"
      />

      {/* Fields section */}
      <div className="space-y-2">
        <span className="block font-mono text-label text-label uppercase text-text-secondary">
          Fields
        </span>

        {fields.length > 0 && (
          <div className="space-y-1.5">
            {fields.map((field, i) => (
              <div key={field.key + i} className="flex items-center gap-1.5 rounded-lg bg-surface-elevated px-2 py-2">
                <div className="flex flex-col items-center gap-px">
                  <button
                    type="button"
                    onClick={() => moveField(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${field.label} up`}
                    className="ring-focus flex h-7 w-7 items-center justify-center rounded text-text-secondary disabled:pointer-events-none disabled:opacity-30 hover:text-text-primary"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(i, 1)}
                    disabled={i === fields.length - 1}
                    aria-label={`Move ${field.label} down`}
                    className="ring-focus flex h-7 w-7 items-center justify-center rounded text-text-secondary disabled:pointer-events-none disabled:opacity-30 hover:text-text-primary"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{field.label}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="ember" mono>
                      {TYPE_LABELS[field.type]}
                    </Badge>
                    {field.type === 'select' && field.options && field.options.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {field.options.map((opt) => (
                          <span key={opt} className="rounded bg-surface-bright px-1.5 py-0.5 text-[10px] text-text-secondary">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditFieldEditor(i)}
                  aria-label={`Edit field ${field.label}`}
                  className="ring-focus press flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-bright hover:text-text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteField(i)}
                  aria-label={`Delete field ${field.label}`}
                  className="ring-focus press flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showFieldEditor && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-variant p-3">
            <Input
              label="Field Label"
              value={editorLabel}
              onChange={(e) => setEditorLabel(e.target.value)}
              placeholder="e.g. Status"
              autoFocus
            />

            <div className="space-y-1.5">
              <span className="block font-mono text-label text-label uppercase text-text-secondary">Type</span>
              <SegmentedControl
                options={TYPE_OPTIONS}
                value={editorType}
                onChange={(v) => setEditorType(v as FieldSchema[0]['type'])}
                ariaLabel="Field type"
              />
            </div>

            {editorType === 'select' && (
              <div className="space-y-1.5">
                <span className="block font-mono text-label text-label uppercase text-text-secondary">
                  Options
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={editorOptionInput}
                    onChange={(e) => setEditorOptionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                    placeholder="Type and press Enter"
                    className="ring-focus h-12 flex-1 rounded-lg border border-border bg-surface-elevated px-3 text-body text-text-primary outline-none placeholder:text-text-tertiary"
                  />
                  <Button
                    type="button"
                    onClick={addOption}
                    disabled={!editorOptionInput.trim()}
                    className="h-12 w-12 px-0"
                    aria-label="Add option"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editorOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editorOptions.map((opt) => (
                      <span key={opt} className="inline-flex items-center gap-1 rounded-full bg-surface-bright px-2.5 py-1 text-xs text-text-primary">
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOption(opt)}
                          className="ring-focus flex h-5 w-5 items-center justify-center rounded-full text-text-secondary hover:text-destructive"
                          aria-label={`Remove option ${opt}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={saveField} disabled={!editorLabel.trim()} size="sm">
                Save Field
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={openNewFieldEditor}
          className="w-full"
        >
          <Plus className="h-4 w-4" /> Add Field
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="completion_field"
          label="Completion Field"
          defaultValue={habit?.completion_field ?? ''}
          placeholder="e.g. status"
        />
        <Input
          name="completion_value"
          label="Completion Value"
          defaultValue={habit?.completion_value ?? ''}
          placeholder="e.g. Prayed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="streak_direction" className="block font-mono text-label text-label uppercase text-text-secondary">
            Streak Direction
          </label>
          <select
            id="streak_direction"
            name="streak_direction"
            defaultValue={habit?.streak_direction ?? 'positive'}
            className="ring-focus h-12 w-full rounded-lg border border-border bg-surface-elevated px-3 text-body text-text-primary outline-none"
          >
            <option value="positive">Positive</option>
            <option value="inverse">Inverse</option>
          </select>
        </div>
        <Input
          name="sort_order"
          label="Sort Order"
          type="number"
          defaultValue={habit?.sort_order ?? 1}
        />
      </div>

      {habit && (
        <label className="flex min-h-11 items-center gap-2.5 text-sm text-text-primary">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={habit.is_active}
            className="h-5 w-5 accent-primary"
          />
          Active
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
