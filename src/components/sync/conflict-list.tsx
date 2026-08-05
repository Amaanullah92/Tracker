'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAll, type PendingWrite } from '@/lib/db-queue'
import { ConflictCard } from './conflict-card'
import { CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { EmptyState } from '@/components/ui/empty-state'

export function ConflictList() {
  const [conflicts, setConflicts] = useState<PendingWrite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const all = await getAll()
    setConflicts(all.filter((i) => i.status === 'conflict'))
    setLoading(false)
  }, [])

  useEffect(() => {
    let ignore = false
    async function start() {
      const all = await getAll()
      if (ignore) return
      setConflicts(all.filter((i) => i.status === 'conflict'))
      setLoading(false)
    }
    start()
    return () => { ignore = true }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-4">
        <p className="text-sm text-text-secondary">Checking for conflicts...</p>
      </div>
    )
  }

  if (conflicts.length === 0) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <AppHeader title="Sync Conflicts" eyebrow="Queue health" />
        <div className="mt-6">
          <EmptyState
            icon={CheckCircle}
            title="No conflicts"
            description="All queued changes have been synced successfully."
            action={
              <Link
                href="/today"
                className="ring-focus press inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary"
              >
                Back to Today
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader
        title="Sync Conflicts"
        eyebrow="Queue health"
        right={
          <button
            onClick={load}
            className="ring-focus press flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            aria-label="Refresh conflicts"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex items-start gap-2.5 rounded-lg border border-tertiary/40 bg-tertiary/10 px-3.5 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
        <p className="text-sm text-text-secondary">
          {conflicts.length} {conflicts.length === 1 ? 'change' : 'changes'} need your attention.
          Choose which version to keep for each field.
        </p>
      </div>

      <div className="space-y-3">
        {conflicts.map((item) => (
          <ConflictCard key={item.id} item={item} onResolved={load} />
        ))}
      </div>
    </div>
  )
}
