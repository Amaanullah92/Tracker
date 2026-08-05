import { forwardRef } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  icon?: React.ReactNode
  helper?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, helper, error, id, className, ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block font-mono text-label text-label uppercase text-text-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={`ring-focus h-12 w-full rounded-lg border bg-surface-elevated text-body text-text-primary outline-none transition-colors placeholder:text-text-tertiary ${
            icon ? 'pl-11' : 'px-4'
          } ${error ? 'border-destructive' : 'border-border'} ${className ?? ''}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : helper ? (
        <p className="text-sm text-text-secondary">{helper}</p>
      ) : null}
    </div>
  )
})
