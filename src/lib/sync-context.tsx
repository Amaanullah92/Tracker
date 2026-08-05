'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { getAll } from './db-queue'
import { syncEvents, SYNC_COMPLETED } from './sync-engine'

export type SyncStatus = 'idle' | 'syncing' | 'conflicts' | 'failed' | 'offline'

const SyncStatusContext = createContext<SyncStatus>('idle')

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const refresh = useCallback(async () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    if (!isOnline) {
      setStatus('offline')
      return
    }

    const items = await getAll()

    const hasPending = items.some(i => i.status === 'pending' || i.status === 'syncing')
    const hasConflicts = items.some(i => i.status === 'conflict')
    const hasFailed = items.some(i => i.status === 'failed')

    if (hasPending) {
      setStatus('syncing')
    } else if (hasConflicts) {
      setStatus('conflicts')
    } else if (hasFailed) {
      setStatus('failed')
    } else {
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    const handleSync = () => { refresh() }
    const handleOnline = () => { refresh() }
    const handleOffline = () => { setStatus('offline') }
    const handleVisible = () => { if (!document.hidden) refresh() }

    syncEvents.addEventListener(SYNC_COMPLETED, handleSync)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisible)

    setTimeout(() => { void refresh() }, 0)

    pollRef.current = setInterval(() => {
      if (!document.hidden) refresh()
    }, 30000)

    return () => {
      syncEvents.removeEventListener(SYNC_COMPLETED, handleSync)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisible)
      clearInterval(pollRef.current)
    }
  }, [refresh])

  return (
    <SyncStatusContext.Provider value={status}>
      {children}
    </SyncStatusContext.Provider>
  )
}

export function useSyncStatus(): SyncStatus {
  return useContext(SyncStatusContext)
}
