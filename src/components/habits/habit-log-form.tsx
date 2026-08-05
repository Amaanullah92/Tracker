'use client'

import { FieldSchema } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Stepper } from '@/components/ui/stepper'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Input } from '@/components/ui/input'

export function HabitLogForm({
  schema,
  values,
  onChange,
}: {
  schema: FieldSchema
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}) {
  function setValue(key: string, value: unknown) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-3.5">
      {schema.map((field) => (
        <div key={field.key}>
          {field.type === 'toggle' && (
            <div className="flex min-h-11 items-center justify-between gap-3">
              <span className="font-mono text-label text-label uppercase text-text-secondary">
                {field.label}
              </span>
              <Switch
                checked={!!values[field.key]}
                onChange={(v) => setValue(field.key, v)}
                label={field.label}
              />
            </div>
          )}

          {field.type === 'number' && (
            <div className="space-y-1.5">
              <span className="block font-mono text-label text-label uppercase text-text-secondary">
                {field.label}
              </span>
              <Stepper
                label={field.label}
                value={(values[field.key] as string | number)?.toString() ?? ''}
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                onChange={(v) => setValue(field.key, v === '' ? '' : Number(v))}
              />
            </div>
          )}

          {field.type === 'select' && field.options && field.variant === 'segmented' && (
            <div className="space-y-1.5">
              <span className="block font-mono text-label text-label uppercase text-text-secondary">
                {field.label}
              </span>
              <SegmentedControl
                options={field.options.map((option) => ({ value: option, label: option }))}
                value={(values[field.key] as string) ?? ''}
                onChange={(option) => setValue(field.key, option)}
                ariaLabel={field.label}
              />
            </div>
          )}

          {field.type === 'select' && field.options && !field.variant && (
            <div className="space-y-1.5">
              <span className="block font-mono text-label text-label uppercase text-text-secondary">
                {field.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const selected = values[field.key] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setValue(field.key, option)}
                      aria-pressed={selected}
                      className={`ring-focus press min-h-11 rounded-lg px-4 text-sm transition-colors duration-150 ${
                        selected
                          ? 'bg-primary font-bold text-on-primary'
                          : 'border border-border bg-surface-elevated text-text-primary'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {field.type === 'text' && (
            <Input
              label={field.label}
              value={(values[field.key] as string) ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
            />
          )}

          {field.type === 'time' && (
            <Input
              type="time"
              label={field.label}
              value={(values[field.key] as string) ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
