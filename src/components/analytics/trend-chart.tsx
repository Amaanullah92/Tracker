'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { HabitLog } from '@/lib/types'

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

  if (data.length === 0) return <p className="text-xs text-text-secondary py-4 text-center">No data</p>

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [value, label]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#166534"
            strokeWidth={2}
            dot={{ r: 3, fill: '#166534' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}