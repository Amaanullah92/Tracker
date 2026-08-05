'use client'

import { Minus, Plus } from 'lucide-react'

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}) {
  function clamp(n: number): number {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }

  function stepValue(delta: number) {
    const current = value === '' ? (min ?? 0) : Number(value)
    if (Number.isNaN(current)) return
    onChange(String(clamp(current + delta)))
  }

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border border-border bg-surface-elevated ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => stepValue(-step)}
        disabled={value !== '' && min !== undefined && Number(value) <= min}
        aria-label={label ? `${label}: decrease` : 'Decrease'}
        className="ring-focus flex h-11 w-12 shrink-0 items-center justify-center text-text-secondary transition-colors hover:bg-surface-bright hover:text-text-primary active:scale-95 disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-11 min-w-0 flex-1 appearance-none bg-transparent text-center font-mono text-body text-text-primary outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => stepValue(step)}
        disabled={value !== '' && max !== undefined && Number(value) >= max}
        aria-label={label ? `${label}: increase` : 'Increase'}
        className="ring-focus flex h-11 w-12 shrink-0 items-center justify-center text-text-secondary transition-colors hover:bg-surface-bright hover:text-text-primary active:scale-95 disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
