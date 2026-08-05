'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AppHeader({
  title,
  eyebrow,
  back,
  onBack,
  right,
}: {
  title: string
  eyebrow?: string
  back?: boolean
  onBack?: () => void
  right?: React.ReactNode
}) {
  const router = useRouter()

  return (
    <header className="mx-auto w-full max-w-lg px-margin-x pt-5 pb-3">
      {eyebrow && (
        <p className="mb-0.5 font-mono text-label text-label uppercase text-text-tertiary">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          {back && (
            <button
              type="button"
              onClick={onBack ?? (() => router.back())}
              aria-label="Go back"
              className="ring-focus press -ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="truncate font-display text-display text-display font-bold tracking-tight text-text-primary">
            {title}
          </h1>
        </div>
        {right}
      </div>
    </header>
  )
}
