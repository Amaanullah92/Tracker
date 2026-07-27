'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAll, type PendingWrite } from '@/lib/db-queue'
import { ConflictCard } from './conflict-card'
import { CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function ConflictList() {
  const [conflicts, setConflicts] = useState<PendingWrite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const all = await getAll()
    setConflicts(all.filter((i) => i.status === 'conflict'))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
        <h1 className="mb-6 text-lg font-bold">Sync Conflicts</h1>
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center">
          <CheckCircle className="mb-5 h-10 w-10 text-tertiary" />
          <p className="text-sm font-medium text-text-primary">No conflicts</p>
          <p className="mt-1.5 text-xs text-text-secondary">
            All queued changes have been synced successfully.
          </p>
          <Link
            href="/today"
            className="mt-6 inline-block rounded-lg bg-primary-container px-6 py-2.5 text-sm font-medium text-white"
          >
            Back to Today
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Sync Conflicts</h1>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-elevated"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <p className="text-sm text-text-secondary">
        {conflicts.length} {conflicts.length === 1 ? 'change' : 'changes'} need your attention.
        Choose which version to keep for each field.
      </p>

      <div className="space-y-3">
        {conflicts.map((item) => (
          <ConflictCard key={item.id} item={item} onResolved={load} />
        ))}
      </div>
    </div>
  )
}
