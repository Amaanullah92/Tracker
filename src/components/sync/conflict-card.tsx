'use client'

import { useState, useEffect } from 'react'
import { type PendingWrite } from '@/lib/db-queue'
import {
  fetchConflictServerData,
  extractFields,
  resolveWithFields,
  formatValue,
  type ConflictField,
} from '@/lib/conflict-utils'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'


const TYPE_LABELS: Record<PendingWrite['type'], string> = {
  habit_log: 'Habit Log',
  body_weight: 'Body Weight',
  gym_set: 'Gym Session',
}

export function ConflictCard({
  item,
  onResolved,
}: {
  item: PendingWrite
  onResolved: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [serverData, setServerData] = useState<Record<string, unknown> | null>(null)
  const [fields, setFields] = useState<ConflictField[]>([])
  const [resolutions, setResolutions] = useState<Record<string, 'mine' | 'server'>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let ignore = false
    async function start() {
      const data = await fetchConflictServerData(item)
      if (ignore) return
      setServerData(data)
      setFields(extractFields(item, data))
      setLoading(false)
    }
    start()
    return () => { ignore = true }
  }, [item])

  function setResolution(key: string, choice: 'mine' | 'server') {
    setResolutions((prev) => ({ ...prev, [key]: choice }))
  }

  const allResolved = fields.length > 0 && fields.every((f) => f.key in resolutions)
  const unresolvedCount = fields.length - Object.keys(resolutions).length

  async function handleSave() {
    if (!allResolved) return
    setSaving(true)
    const choices = fields.map((f) => ({
      key: f.key,
      chosen: resolutions[f.key],
    }))
    await resolveWithFields(item, serverData, choices)
    setSaving(false)
    onResolved()
  }

  async function handleAcceptAll(choice: 'mine' | 'server') {
    setSaving(true)
    const choices = fields.map((f) => ({
      key: f.key,
      chosen: choice,
    }))
    await resolveWithFields(item, serverData, choices)
    setSaving(false)
    onResolved()
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">Loading conflict data...</p>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">No conflicting fields found.</p>
      </div>
    )
  }

  const typeLabel = TYPE_LABELS[item.type]
  const targetInfo = formatTargetInfo(item)

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {typeLabel}
          </p>
          <p className="text-xs text-text-secondary truncate">{targetInfo}</p>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field) => {
          const chosen = resolutions[field.key] ?? null
          return (
            <div key={field.key}>
              <p className="mb-1.5 font-mono text-xs font-semibold tracking-widest uppercase text-text-secondary">
                {field.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResolution(field.key, 'mine')}
                  className={`rounded-lg border p-2 text-left text-sm transition-colors ${
                    chosen === 'mine'
                      ? 'border-primary bg-primary-container/10 text-primary'
                      : 'border-border bg-surface-elevated text-text-primary hover:border-primary/50'
                  }`}
                >
                  <span className="mb-0.5 block font-mono text-[10px] font-semibold tracking-widest uppercase text-text-secondary">
                    Yours
                  </span>
                  <span className="break-words">{formatValue(field.myValue)}</span>
                </button>
                <button
                  onClick={() => setResolution(field.key, 'server')}
                  className={`rounded-lg border p-2 text-left text-sm transition-colors ${
                    chosen === 'server'
                      ? 'border-primary bg-primary-container/10 text-primary'
                      : 'border-border bg-surface-elevated text-text-primary hover:border-primary/50'
                  }`}
                >
                  <span className="mb-0.5 block font-mono text-[10px] font-semibold tracking-widest uppercase text-text-secondary">
                    Server
                  </span>
                  <span className="break-words">{formatValue(field.serverValue)}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => handleAcceptAll('mine')}
          disabled={saving}
          className="flex-1"
        >
          Accept all mine
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAcceptAll('server')}
          disabled={saving}
          className="flex-1"
        >
          Accept all server
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={!allResolved || saving}
        className="mt-2 w-full"
      >
        {saving
          ? 'Saving...'
          : allResolved
            ? 'Save this record'
            : `Resolve ${unresolvedCount} more field${unresolvedCount === 1 ? '' : 's'}...`}
      </Button>
    </div>
  )
}

function formatTargetInfo(item: PendingWrite): string {
  switch (item.type) {
    case 'habit_log':
      return `${item.payload.habit_id as string} \u00b7 ${item.payload.log_date as string}`
    case 'body_weight':
      return `${item.payload.log_date as string}`
    case 'gym_set':
      return `Session ${(item.payload.p_session_id as string).slice(0, 8)}...`
  }
}
