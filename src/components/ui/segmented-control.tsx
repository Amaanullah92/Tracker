'use client'

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  ariaLabel,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? label}
      className="flex gap-1 rounded-lg bg-surface-elevated p-1"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`ring-focus min-h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-150 active:scale-[0.98] ${
              active
                ? 'bg-bg text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
