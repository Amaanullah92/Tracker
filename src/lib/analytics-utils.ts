import { FieldSchema } from './types'
import { todayPKT } from './pkt-utils'

export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function computeVolume(weight: number, reps: number): number {
  return weight * reps
}

export function getChartTypeForField(field: FieldSchema[number]): 'completion' | 'trend' | 'distribution' {
  switch (field.type) {
    case 'toggle':
      return 'completion'
    case 'number':
      return 'trend'
    case 'select':
      return 'distribution'
    default:
      return 'completion'
  }
}

export function getChartableFields(schema: FieldSchema) {
  return schema.filter((f) => f.type === 'toggle' || f.type === 'number' || f.type === 'select')
}

export function dateRangeDates(range: string): { start: string; end: string } {
  const end = todayPKT()
  let start: string
  const today = new Date(end + 'T12:00:00Z')
  switch (range) {
    case '7d':
      start = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10)
      break
    case '30d':
      start = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10)
      break
    case '90d':
      start = new Date(today.getTime() - 90 * 86400000).toISOString().slice(0, 10)
      break
    case 'all':
      start = '2000-01-01'
      break
    default:
      start = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10)
  }
  return { start, end }
}