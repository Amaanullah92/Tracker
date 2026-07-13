'use client'

import { FieldSchema } from '@/lib/types'

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
    <div className="space-y-3">
      {schema.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">
            {field.label}
          </label>
          {field.type === 'toggle' && (
            <button
              type="button"
              role="switch"
              aria-checked={!!values[field.key]}
              onClick={() => setValue(field.key, !values[field.key])}
              className={`relative h-11 w-20 rounded-full transition-colors ${
                values[field.key] ? 'bg-primary-container' : 'bg-surface-elevated'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-9 w-9 rounded-full bg-surface-bright shadow transition-transform ${
                  values[field.key] ? 'translate-x-9' : ''
                }`}
              />
            </button>
          )}
          {field.type === 'number' && (
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={(values[field.key] as string | number) ?? ''}
              onChange={(e) =>
                setValue(field.key, e.target.value ? Number(e.target.value) : '')
              }
              className="w-full min-h-[44px] rounded-lg border border-border bg-surface-elevated px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          )}
          {field.type === 'select' && field.options && field.variant === 'segmented' && (
            <div className="flex rounded-lg border border-border overflow-hidden">
              {field.options.map((option, idx) => {
                const selected = values[field.key] === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue(field.key, option)}
                    className={`flex-1 min-h-[44px] text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-elevated text-text-secondary'
                    } ${idx > 0 ? 'border-l border-border' : ''}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          )}
          {field.type === 'select' && field.options && !field.variant && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((option) => {
                const selected = values[field.key] === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue(field.key, option)}
                    className={`min-h-[44px] rounded-lg px-4 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-elevated text-text-primary border border-border'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          )}
          {field.type === 'text' && (
            <input
              type="text"
              value={(values[field.key] as string) ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-border bg-surface-elevated px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          )}
          {field.type === 'time' && (
            <input
              type="time"
              value={(values[field.key] as string) ?? ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-border bg-surface-elevated px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          )}
        </div>
      ))}
    </div>
  )
}