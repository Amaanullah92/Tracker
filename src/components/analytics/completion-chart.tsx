'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { HabitLog } from '@/lib/types'
import { weekStartPKT } from '@/lib/pkt-utils'
import { chartTokens, ChartEmpty } from './chart-theme'

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

  if (data.length === 0) return <ChartEmpty />

  return (
    <div className="h-32" role="img" aria-label="Weekly completion rate chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" tick={chartTokens.tick} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={chartTokens.tick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Rate']}
            contentStyle={chartTokens.tooltip.contentStyle}
            labelStyle={chartTokens.tooltip.labelStyle}
            itemStyle={chartTokens.tooltip.itemStyle}
            cursor={chartTokens.tooltip.cursor}
          />
          <Bar
            dataKey="rate"
            fill="var(--color-secondary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
