import { createClient } from './supabase/client'

export function shouldQueue(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true

  if (!error || typeof error !== 'object') return false

  const err = error as Record<string, unknown>
  if (typeof err.code === 'string') return false

  return true
}

export async function fetchBaseVersion(
  table: string,
  targetKey: Record<string, unknown>,
  _fallback: string | null,
): Promise<string | null | 'UNKNOWN'> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select('updated_at')
      .match(targetKey)
      .maybeSingle()
    if (error) return 'UNKNOWN'
    if (data?.updated_at) return data.updated_at
    return null
  } catch {
    return 'UNKNOWN'
  }
}
