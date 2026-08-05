'use client'

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`ring-focus relative h-11 w-[4.25rem] shrink-0 rounded-full transition-colors duration-150 active:scale-[0.97] ${
        checked ? 'bg-primary' : 'bg-surface-elevated'
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-9 w-9 rounded-full shadow-md transition-transform duration-150 ease-standard ${
          checked
            ? 'translate-x-6 bg-text-primary'
            : 'translate-x-0 bg-surface-bright'
        }`}
      />
    </button>
  )
}
