'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { HabitLog } from '@/lib/types'
import { weekStartPKT } from '@/lib/pkt-utils'
import { chartTokens, ChartEmpty } from './chart-theme'

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

  if (data.length === 0) return <ChartEmpty />

  return (
    <div
      className="h-40"
      role="img"
      aria-label={`Distribution of ${options.join(', ')} per week`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" tick={chartTokens.tick} axisLine={false} tickLine={false} />
          <YAxis tick={chartTokens.tick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={chartTokens.tooltip.contentStyle}
            labelStyle={chartTokens.tooltip.labelStyle}
            itemStyle={chartTokens.tooltip.itemStyle}
            cursor={chartTokens.tooltip.cursor}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: 'var(--color-text-secondary)', paddingTop: 8 }}
          />
          {options.map((option, i) => (
            <Bar
              key={option}
              dataKey={option}
              stackId="a"
              fill={chartTokens.palette[i % chartTokens.palette.length]}
              radius={i === options.length - 1 ? [3, 3, 0, 0] : 0}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
