'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { HabitLog } from '@/lib/types'
import { weekStartPKT } from '@/lib/pkt-utils'

const COLORS = ['#166534', '#22c55e', '#86efac', '#d97706', '#fbbf24']

export function DistributionChart({
  logs,
  selectKey,
  options,
}: {
  logs: Pick<HabitLog, 'log_date' | 'values'>[]
  selectKey: string
  options: string[]
}) {
  const data = useMemo(() => {
    const weekly: Record<string, Record<string, number>> = {}

    for (const log of logs) {
      const key = weekStartPKT(log.log_date)

      if (!weekly[key]) {
        weekly[key] = Object.fromEntries(options.map((o) => [o, 0]))
      }

      const val = (log.values as Record<string, unknown>)[selectKey] as string | undefined
      if (val && weekly[key][val] !== undefined) {
        weekly[key][val]++
      }
    }

    return Object.entries(weekly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, counts]) => ({
        week: week.slice(5),
        ...counts,
      }))
  }, [logs, selectKey, options])

  if (data.length === 0) return <p className="text-xs text-text-secondary py-4 text-center">No data</p>

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {options.map((option, i) => (
            <Bar
              key={option}
              dataKey={option}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              radius={i === options.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}