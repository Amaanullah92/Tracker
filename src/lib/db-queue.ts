import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'tracker-offline-queue'
const DB_VERSION = 1
const STORE_NAME = 'pending_writes'

export type PendingWrite = {
  id: string
  type: 'habit_log' | 'body_weight' | 'gym_set'
  action: 'upsert' | 'delete'
  payload: Record<string, unknown>
  targetKey: Record<string, unknown>
  baseVersion: string | null | 'UNKNOWN'
  queuedAt: string
  status: 'pending' | 'syncing' | 'conflict' | 'failed'
  attemptCount: number
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status')
      }
    },
  })
}

export async function enqueue(write: Omit<PendingWrite, 'id' | 'queuedAt' | 'status' | 'attemptCount'>): Promise<void> {
  const db = await getDb()
  await db.add(STORE_NAME, {
    ...write,
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    status: 'pending',
    attemptCount: 0,
  })
}

export async function dequeue(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export async function updateStatus(id: string, status: PendingWrite['status']): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const item = await tx.store.get(id)
  if (item) {
    item.status = status
    await tx.store.put(item)
  }
  await tx.done
}

export async function getQueueLength(): Promise<number> {
  const db = await getDb()
  return db.count(STORE_NAME)
}

export async function getAll(): Promise<PendingWrite[]> {
  const db = await getDb()
  return db.getAll(STORE_NAME)
}

export async function getItem(id: string): Promise<PendingWrite | undefined> {
  const db = await getDb()
  return db.get(STORE_NAME, id)
}

export async function incrementAttempt(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const item = await tx.store.get(id)
  if (item) {
    item.attemptCount = (item.attemptCount ?? 0) + 1
    await tx.store.put(item)
  }
  await tx.done
}
