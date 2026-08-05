export const chartTokens = {
  grid: 'var(--color-border)',
  tick: { fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-plex), monospace' },
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      fontSize: 12,
      color: 'var(--color-text-primary)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: 'var(--color-text-secondary)', fontSize: 11 },
    itemStyle: { color: 'var(--color-text-primary)' },
    cursor: { fill: 'rgba(255,107,53,0.06)' },
  },
  palette: ['#ff6b35', '#7bd88f', '#ffc24b', '#4a90d9', '#8a8070', '#e8591e'],
}

export function ChartEmpty() {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-sm text-text-tertiary">No data yet - keep going.</p>
    </div>
  )
}
