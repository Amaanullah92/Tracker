import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-headline text-headline text-text-primary">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-[260px] text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
