'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 animate-fade-in bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg animate-sheet-up rounded-t-xl border-x border-t border-border bg-surface">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-surface-bright" aria-hidden />
        <div className="flex items-center justify-between px-5 pt-3">
          {title && (
            <h2 className="font-display text-headline-lg text-headline-lg text-text-primary">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ring-focus press -mr-1 ml-auto flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-5 pb-4 pt-2">{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
