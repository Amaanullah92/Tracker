'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { HabitLog } from '@/lib/types'
import { chartTokens, ChartEmpty } from './chart-theme'

export function TrendChart({
  logs,
  valueKey,
  label,
}: {
  logs: Pick<HabitLog, 'log_date' | 'values'>[]
  valueKey: string
  label: string
}) {
  const data = useMemo(() => {
    return logs
      .map((log) => {
        const val = (log.values as Record<string, unknown>)[valueKey]
        return {
          date: log.log_date.slice(5),
          value: typeof val === 'number' ? val : parseFloat(String(val ?? '')),
        }
      })
      .filter((d) => !isNaN(d.value))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [logs, valueKey])

  if (data.length === 0) return <ChartEmpty />

  return (
    <div
      className="h-40"
      role="img"
      aria-label={`${label} trend chart, ${data.length} data points`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid} vertical={false} />
          <XAxis dataKey="date" tick={chartTokens.tick} axisLine={false} tickLine={false} />
          <YAxis tick={chartTokens.tick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={(value) => [String(value), label]}
            contentStyle={chartTokens.tooltip.contentStyle}
            labelStyle={chartTokens.tooltip.labelStyle}
            itemStyle={chartTokens.tooltip.itemStyle}
            cursor={chartTokens.tooltip.cursor}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
