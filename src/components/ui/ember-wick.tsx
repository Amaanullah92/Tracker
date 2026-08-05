export type WickDay = {
  date: string
  done: boolean
  isToday: boolean
}

export function EmberWick({
  days,
  label,
}: {
  days: WickDay[]
  label?: string
}) {
  const doneCount = days.filter((d) => d.done).length

  return (
    <div
      role="img"
      aria-label={label ?? `Last ${days.length} days: ${doneCount} of ${days.length} kept alive`}
      title={label ?? `${doneCount}/${days.length} days kept alive`}
      className="flex items-end gap-1.5"
    >
      {days.map((day) => (
        <span
          key={day.date}
          title={day.date}
          className={`w-2 rounded-full transition-colors duration-150 ${
            day.isToday
              ? day.done
                ? 'h-9 animate-ember-pulse bg-primary'
                : 'h-9 animate-ember-pulse bg-surface-bright ring-1 ring-primary/60'
              : day.done
                ? 'h-6 bg-primary/70'
                : 'h-6 bg-surface-bright'
          }`}
        />
      ))}
    </div>
  )
}
