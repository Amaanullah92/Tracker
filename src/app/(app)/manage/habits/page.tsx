'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FieldSchema, Habit } from '@/lib/types'
import { Plus, Pencil, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

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

  useEffect(() => { load() }, [])

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

    await supabase.from('habits').insert({
      name,
      description: desc || null,
      field_schema: schema,
      completion_field: completionField,
      completion_value: completionValue,
      streak_direction: streakDirection,
      is_active: true,
      sort_order: sortOrder,
    })
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

    await supabase.from('habits').update({
      name,
      description: (form.get('description') as string) || null,
      field_schema: schema,
      completion_field: (form.get('completion_field') as string) || null,
      completion_value: (form.get('completion_value') as string) || null,
      streak_direction: form.get('streak_direction') as 'positive' | 'inverse',
      is_active: form.get('is_active') === 'on',
      sort_order: parseInt(form.get('sort_order') as string) || 1,
    }).eq('id', id)
    setEditingId(null)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('habits').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-[480px] px-margin-x space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-text-primary">Manage Habits</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {showCreate && (
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          submitLabel="Create"
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
              submitLabel="Save"
            />
          )
        }

        return (
          <div key={habit.id} className="rounded-xl bg-surface p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{habit.name}</h2>
                {habit.description && (
                  <p className="mt-0.5 text-xs text-text-secondary">{habit.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-background px-1.5 py-0.5 text-xs text-text-secondary">
                    {habit.streak_direction}
                  </span>
                  {habit.completion_field && (
                    <span className="rounded-md bg-background px-1.5 py-0.5 text-xs text-text-secondary">
                      {habit.completion_field}={habit.completion_value ?? 'on'}
                    </span>
                  )}
                  {!habit.is_active && (
                    <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                      inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button
                  onClick={() => setEditingId(habit.id)}
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-background"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="rounded-lg p-1.5 text-text-secondary hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

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

  const TYPE_LABELS: Record<string, string> = {
    toggle: 'Toggle',
    number: 'Number',
    select: 'Select',
    text: 'Text',
    time: 'Time',
  }

  return (
    <form action={onSubmit} className="rounded-xl bg-surface p-4 space-y-3">
      <input ref={hiddenSchemaRef} name="field_schema" type="hidden" defaultValue={JSON.stringify(fields)} />

      <input
        name="name"
        defaultValue={habit?.name}
        placeholder="Habit name"
        className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
        required
      />

      <input
        name="description"
        defaultValue={habit?.description ?? ''}
        placeholder="Description (optional)"
        className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
      />

      {/* Fields section */}
      <div>
        <label className="mb-2 block text-xs font-medium text-text-secondary">Fields</label>

        <div className="space-y-1.5">
          {fields.map((field, i) => (
            <div key={field.key + i} className="flex items-center gap-1.5 rounded-lg bg-background px-2 py-1.5">
              <div className="flex flex-col items-center gap-px">
                <button
                  type="button"
                  onClick={() => moveField(i, -1)}
                  disabled={i === 0}
                  className="flex h-4 w-4 items-center justify-center text-text-secondary disabled:opacity-30 hover:text-text-primary"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveField(i, 1)}
                  disabled={i === fields.length - 1}
                  className="flex h-4 w-4 items-center justify-center text-text-secondary disabled:opacity-30 hover:text-text-primary"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{field.label}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {TYPE_LABELS[field.type]}
                  </span>
                  {field.type === 'select' && field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {field.options.map((opt) => (
                        <span key={opt} className="rounded-md bg-background px-1.5 py-0.5 text-[10px] text-text-secondary">
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => deleteField(i)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {showFieldEditor && (
          <div className="mt-2 rounded-lg bg-surface-variant p-3 space-y-2.5">
            <input
              type="text"
              value={editorLabel}
              onChange={(e) => setEditorLabel(e.target.value)}
              placeholder="Field label"
              className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 text-sm"
              autoFocus
            />

            <div>
              <label className="mb-1 text-xs text-text-secondary">Type</label>
              <div className="flex gap-1">
                {(['toggle', 'number', 'select', 'text', 'time'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditorType(t)}
                    className={`min-h-[36px] flex-1 rounded-lg text-xs font-medium transition-colors ${
                      editorType === t
                        ? 'bg-primary text-white'
                        : 'border border-border bg-surface text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {editorType === 'select' && (
              <div>
                <label className="mb-1 text-xs text-text-secondary">Options</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={editorOptionInput}
                    onChange={(e) => setEditorOptionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                    placeholder="Type and press Enter"
                    className="flex-1 min-h-[44px] rounded-lg border border-border bg-surface px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={!editorOptionInput.trim()}
                    className="flex min-h-[44px] w-[44px] items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {editorOptions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {editorOptions.map((opt) => (
                      <span key={opt} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-xs">
                        {opt}
                        <button type="button" onClick={() => removeOption(opt)} className="text-text-secondary hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={saveField}
                disabled={!editorLabel.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                Save Field
              </button>
              <button type="button" onClick={closeEditor} className="rounded-lg border border-border px-4 py-2 text-xs font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={openNewFieldEditor}
          className="mt-2 flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-background"
        >
          <Plus className="h-3.5 w-3.5" /> Add Field
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary">Completion field</label>
          <input
            name="completion_field"
            defaultValue={habit?.completion_field ?? ''}
            placeholder="e.g. status"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Completion value</label>
          <input
            name="completion_value"
            defaultValue={habit?.completion_value ?? ''}
            placeholder="e.g. Prayed"
            className="mt-1 w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary">Streak direction</label>
          <select
            name="streak_direction"
            defaultValue={habit?.streak_direction ?? 'positive'}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="positive">Positive</option>
            <option value="inverse">Inverse</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-text-secondary">Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={habit?.sort_order ?? 1}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>

      {habit && (
        <label className="flex items-center gap-2 text-sm">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={habit.is_active}
            className="h-4 w-4 rounded border-border"
          />
          Active
        </label>
      )}

      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
