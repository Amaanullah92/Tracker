'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { HabitLog } from '@/lib/types'
import { weekStartPKT } from '@/lib/pkt-utils'

export function CompletionChart({
  logs,
  completionField,
  streakDirection,
}: {
  logs: Pick<HabitLog, 'log_date' | 'values'>[]
  completionField: string
  streakDirection: 'positive' | 'inverse'
}) {
  const data = useMemo(() => {
    const weekly: Record<string, { total: number; done: number }> = {}

    for (const log of logs) {
      const key = weekStartPKT(log.log_date)

      if (!weekly[key]) weekly[key] = { total: 0, done: 0 }
      weekly[key].total++

      const val = (log.values as Record<string, unknown>)[completionField]
      const isDone = typeof val === 'boolean' ? val : val === 'true' || val === true

      if (streakDirection === 'inverse') {
        // Inverse: "not done" is the desired state → show % clean
        if (!isDone) weekly[key].done++
      } else {
        if (isDone) weekly[key].done++
      }
    }

    return Object.entries(weekly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { total, done }]) => ({
        week: week.slice(5),
        rate: total > 0 ? Math.round((done / total) * 100) : 0,
      }))
  }, [logs, completionField, streakDirection])

  if (data.length === 0) return <p className="text-xs text-text-secondary py-4 text-center">No data</p>

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Rate']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
          />
          <Bar dataKey="rate" fill="#166534" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}