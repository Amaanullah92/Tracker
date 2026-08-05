type BadgeTone = 'neutral' | 'success' | 'amber' | 'ember' | 'danger'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-elevated text-text-secondary',
  success: 'bg-secondary-container/40 text-secondary',
  amber: 'bg-tertiary-container/40 text-tertiary',
  ember: 'bg-primary/15 text-primary',
  danger: 'bg-destructive/15 text-destructive',
}

export function Badge({
  children,
  tone = 'neutral',
  mono,
  className,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  mono?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-tiny font-medium ${toneClasses[tone]} ${
        mono ? 'font-mono uppercase tracking-wider' : ''
      } ${className ?? ''}`}
    >
      {children}
    </span>
  )
}
