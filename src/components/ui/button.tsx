import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary font-bold hover:bg-primary-fixed',
  secondary:
    'bg-surface-bright text-text-primary font-semibold hover:opacity-90',
  outline:
    'border border-border bg-transparent text-text-primary font-semibold hover:bg-bg-secondary',
  ghost:
    'bg-transparent text-text-primary font-semibold hover:bg-bg-secondary',
  destructive:
    'bg-transparent text-destructive font-semibold hover:bg-destructive/10',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-5 text-base',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading, className, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`ring-focus inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    )
  },
)
