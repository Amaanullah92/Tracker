'use client'

import { useEffect } from 'react'
import { setupAutoSync, processQueue } from '@/lib/sync-engine'

export function SyncSetup() {
  useEffect(() => {
    console.log('[sync] processQueue triggered on mount')
    processQueue().catch(() => {})
    const cleanup = setupAutoSync()
    return cleanup
  }, [])

  return null
}
