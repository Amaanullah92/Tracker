import { createClient } from './supabase/client'
import { dequeue, type PendingWrite } from './db-queue'

export type ConflictField = {
  key: string
  label: string
  myValue: unknown
  serverValue: unknown
}

const TABLE: Record<PendingWrite['type'], string | null> = {
  habit_log: 'habit_logs',
  body_weight: 'body_weight_logs',
  gym_set: null,
}

export async function fetchConflictServerData(
  item: PendingWrite,
): Promise<Record<string, unknown> | null> {
  const supabase = createClient()
  const table = TABLE[item.type]

  if (table) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .match(item.targetKey)
      .maybeSingle()
    return data
  }

  if (item.type === 'gym_set') {
    const sessionId = item.targetKey.session_id as string
    if (!sessionId) return null

    const { data: ses } = await supabase
      .from('session_exercises')
      .select('id, exercise_id, exercises!inner(name)')
      .eq('session_id', sessionId)

    if (!ses) return null

    const seIds = ses.map((s) => s.id)
    const allSets: Record<string, unknown>[] = []
    if (seIds.length > 0) {
      const { data: sets } = await supabase
        .from('sets')
        .select('*, session_exercises!inner(exercise_id)')
        .in('session_exercise_id', seIds)
      allSets.push(...(sets ?? []))
    }

    return {
      session_id: sessionId,
      session_exercises: ses,
      sets: allSets,
    }
  }

  return null
}

function isPlainObject(v: unknown): boolean {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepCompare(
  my: Record<string, unknown> | undefined,
  server: Record<string, unknown> | undefined,
  prefix: string,
): ConflictField[] {
  const fields: ConflictField[] = []
  const allKeys = [
    ...new Set([...Object.keys(my ?? {}), ...Object.keys(server ?? {})]),
  ]

  for (const key of allKeys) {
    const myVal = my?.[key]
    const serverVal = server?.[key]
    const fieldKey = prefix ? `${prefix}.${key}` : key

    if (isPlainObject(myVal) && isPlainObject(serverVal)) {
      fields.push(
        ...deepCompare(
          myVal as Record<string, unknown>,
          serverVal as Record<string, unknown>,
          fieldKey,
        ),
      )
    } else if (String(myVal) !== String(serverVal)) {
      fields.push({
        key: fieldKey,
        label: fieldKey,
        myValue: myVal,
        serverValue: serverVal,
      })
    }
  }

  return fields
}

function compareGymSets(
  payload: Record<string, unknown>,
  serverData: Record<string, unknown>,
): ConflictField[] {
  const mySets = (payload.p_sets as unknown[]) ?? []
  const serverSes = (serverData.session_exercises as unknown[]) ?? []
  const serverSets = (serverData.sets as unknown[]) ?? []

  const fields: ConflictField[] = []

  for (const se of serverSes) {
    const seRecord = se as Record<string, unknown>
    const exName = ((seRecord.exercises as Record<string, unknown>)?.name as string) ?? 'Unknown'
    const serverSetsForEx = serverSets.filter(
      (s) => (s as Record<string, unknown>).session_exercise_id === seRecord.id,
    )
    const mySetsForEx = mySets.filter(
      (s) => (s as Record<string, unknown>).session_exercise_id === seRecord.id,
    )

    if (JSON.stringify(mySetsForEx) !== JSON.stringify(serverSetsForEx)) {
      fields.push({
        key: `exercise.${seRecord.id}`,
        label: exName,
        myValue: mySetsForEx,
        serverValue: serverSetsForEx,
      })
    }
  }

  return fields
}

export function extractFields(
  item: PendingWrite,
  serverData: Record<string, unknown> | null,
): ConflictField[] {
  if (!serverData) return []

  switch (item.type) {
    case 'habit_log': {
      const myValues = (item.payload.values as Record<string, unknown>) ?? {}
      const serverValues = (serverData.values as Record<string, unknown>) ?? {}
      return deepCompare(myValues, serverValues, '')
    }
    case 'body_weight': {
      const fields: ConflictField[] = []
      if (String(item.payload.weight_kg) !== String(serverData.weight_kg)) {
        fields.push({
          key: 'weight_kg',
          label: 'Weight (kg)',
          myValue: item.payload.weight_kg,
          serverValue: serverData.weight_kg,
        })
      }
      return fields
    }
    case 'gym_set': {
      return compareGymSets(item.payload, serverData)
    }
  }
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj as unknown)
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {}
    }
    current = current[parts[i]] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

export async function resolveWithFields(
  item: PendingWrite,
  serverData: Record<string, unknown> | null,
  choices: { key: string; chosen: 'mine' | 'server' }[],
): Promise<void> {
  const supabase = createClient()

  switch (item.type) {
    case 'body_weight': {
      const weightField = choices.find((c) => c.key === 'weight_kg')
      const weightKg =
        weightField?.chosen === 'mine'
          ? item.payload.weight_kg
          : serverData?.weight_kg ?? item.payload.weight_kg
      await supabase.from('body_weight_logs').upsert(
        { user_id: item.payload.user_id, log_date: item.payload.log_date, weight_kg: weightKg },
        { onConflict: 'user_id, log_date' },
      )
      break
    }
    case 'habit_log': {
      const myValues = (item.payload.values as Record<string, unknown>) ?? {}
      const mergedValues: Record<string, unknown> = serverData?.values
        ? JSON.parse(JSON.stringify(serverData.values))
        : {}

      for (const c of choices) {
        if (c.chosen === 'mine') {
          const myVal = getNested(myValues, c.key)
          setNested(mergedValues, c.key, myVal)
        }
      }

      await supabase.from('habit_logs').upsert(
        {
          habit_id: item.payload.habit_id,
          log_date: item.payload.log_date,
          values: mergedValues,
        },
        { onConflict: 'habit_id, log_date' },
      )
      break
    }
    case 'gym_set': {
      const sessionChoice = choices[0]?.chosen
      if (sessionChoice === 'mine') {
        await supabase.rpc('set_session_sets', item.payload as { p_session_id: string; p_sets: unknown })
      }
      break
    }
  }

  await dequeue(item.id)
}

export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '\u2014'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) {
    return v
      .map((s) => `${(s as Record<string, unknown>).set_number}: ${s.weight_kg}kg \u00d7 ${s.reps}`)
      .join(', ')
  }
  return String(v)
}
