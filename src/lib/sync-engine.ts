import { createClient } from './supabase/client'
import {
  getAll,
  dequeue,
  updateStatus,
  incrementAttempt,
  getItem,
  type PendingWrite,
} from './db-queue'
import { shouldQueue } from './offline'

export const syncEvents = new EventTarget()
export const SYNC_COMPLETED = 'sync-completed'

const MAX_ATTEMPTS = 5
const TABLE_FOR_TYPE: Record<PendingWrite['type'], string | null> = {
  habit_log: 'habit_logs',
  body_weight: 'body_weight_logs',
  gym_set: null,
}

export async function processQueue(): Promise<{
  synced: number
  conflicts: number
  failed: number
}> {
  const items = await getAll()
  const pending = items.filter((i) => i.status === 'pending')

  let synced = 0
  let conflicts = 0
  let failed = 0

  for (const item of pending) {
    await updateStatus(item.id, 'syncing')

    try {
      const result = await syncItem(item)

      if (result === 'synced') {
        await dequeue(item.id)
        synced++
      } else if (result === 'conflict') {
        await updateStatus(item.id, 'conflict')
        conflicts++
      } else if (result === 'retry') {
        await incrementAttempt(item.id)
        const refreshed = await getItem(item.id)
        const attempts = refreshed?.attemptCount ?? 0
        if (attempts >= MAX_ATTEMPTS) {
          await updateStatus(item.id, 'failed')
          failed++
        } else {
          await updateStatus(item.id, 'pending')
        }
      } else {
        await updateStatus(item.id, 'failed')
        failed++
      }
    } catch (e) {
      console.log('[sync] item', item.id, 'caught unexpected error:', e)
      await updateStatus(item.id, 'failed')
      failed++
    }
  }

  syncEvents.dispatchEvent(new CustomEvent(SYNC_COMPLETED, {
    detail: { synced, conflicts, failed },
  }))

  return { synced, conflicts, failed }
}

async function syncItem(
  item: PendingWrite,
): Promise<'synced' | 'conflict' | 'retry' | 'server_error'> {
  const supabase = createClient()
  const table = TABLE_FOR_TYPE[item.type]

  let serverRow: { updated_at: string } | null = null
  let fetchError: unknown = null

  if (table) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('updated_at')
        .match(item.targetKey)
        .maybeSingle()

      if (error) {
        fetchError = error
      } else {
        serverRow = data
      }
    } catch (e) {
      fetchError = e
    }

    if (fetchError) {
      return shouldQueue(fetchError) ? 'retry' : 'server_error'
    }
  }

  if (table) {
    if (serverRow) {
      if (item.baseVersion !== null && serverRow.updated_at !== item.baseVersion) {
        return 'conflict'
      }
    } else {
      if (item.baseVersion !== null && item.baseVersion !== 'UNKNOWN') {
        return 'conflict'
      }
    }
  } else {
    const conflict = await checkGymSetConflict(supabase, item)
    if (conflict === 'retry') return 'retry'
    if (conflict === 'server_error') return 'server_error'
    if (conflict === 'conflict') return 'conflict'
  }

  return applyWrite(supabase, item)
}

async function checkGymSetConflict(
  supabase: ReturnType<typeof createClient>,
  item: PendingWrite,
): Promise<'no_conflict' | 'conflict' | 'retry' | 'server_error'> {
  const sessionId = item.targetKey.session_id as string
  if (!sessionId) return 'no_conflict'

  if (item.baseVersion === 'UNKNOWN') return 'conflict'
  if (item.baseVersion === null) return 'no_conflict'

  try {
    const { data: ses, error: sesError } = await supabase
      .from('session_exercises')
      .select('id')
      .eq('session_id', sessionId)

    if (sesError) return shouldQueue(sesError) ? 'retry' : 'server_error'

    const seIds = (ses ?? []).map((s) => s.id)

    let currentSets: { updated_at: string }[] = []
    if (seIds.length > 0) {
      const { data: sets, error: setsError } = await supabase
        .from('sets')
        .select('updated_at')
        .in('session_exercise_id', seIds)

      if (setsError) return shouldQueue(setsError) ? 'retry' : 'server_error'
      currentSets = sets ?? []
    }

    const maxServerUpdated = currentSets.reduce<string | null>(
      (latest, s) => (!latest || s.updated_at > latest ? s.updated_at : latest),
      null,
    )

    if (maxServerUpdated !== item.baseVersion) return 'conflict'

    return 'no_conflict'
  } catch (e) {
    return shouldQueue(e) ? 'retry' : 'server_error'
  }
}

async function applyWrite(
  supabase: ReturnType<typeof createClient>,
  item: PendingWrite,
): Promise<'synced' | 'retry' | 'server_error'> {
  try {
    let result: { error?: unknown } = {}

    switch (item.type) {
      case 'habit_log':
        result = await supabase
          .from('habit_logs')
          .upsert(item.payload as Record<string, unknown>, {
            onConflict: 'habit_id, log_date',
          })
        break
      case 'body_weight':
        result = await supabase
          .from('body_weight_logs')
          .upsert(item.payload as Record<string, unknown>, {
            onConflict: 'user_id, log_date',
          })
        break
      case 'gym_set':
        result = await supabase.rpc(
          'set_session_sets',
          item.payload as { p_session_id: string; p_sets: unknown },
        )
        break
    }

    if (result.error) {
      return shouldQueue(result.error) ? 'retry' : 'server_error'
    }

    return 'synced'
  } catch (e) {
    return shouldQueue(e) ? 'retry' : 'server_error'
  }
}

export function setupAutoSync(): () => void {
  const handler = () => {
    processQueue()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handler)
    window.addEventListener('focus', handler)
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handler)
      window.removeEventListener('focus', handler)
    }
  }
}
