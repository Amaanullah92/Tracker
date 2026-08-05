export function BrandMark({
  size = 40,
  withWordmark = true,
  wordmarkClass = 'font-display text-3xl font-bold tracking-tight text-text-primary',
}: {
  size?: number
  withWordmark?: boolean
  wordmarkClass?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <path
          d="M24 4c-3.2 5.2-10.6 11-10.6 21.4a10.6 10.6 0 0 0 21.2 0C34.6 15 27.2 9.2 24 4Z"
          fill="var(--color-primary)"
        />
        <path
          d="M24 15.5c-2.2 3.4-6.6 7.4-6.6 12.4a6.6 6.6 0 0 0 13.2 0c0-5-4.4-9-6.6-12.4Z"
          fill="var(--color-on-primary-container)"
        />
        <path
          d="M24 34.5a6.6 6.6 0 0 0 6.6-6.6c0-1.6-.6-3.2-1.4-4.6-.4 3.4-2.4 5.4-5.2 5.4-2.5 0-4.4-1.6-5.3-4.2-.5 1.2-.9 2.3-.9 3.4a6.6 6.6 0 0 0 6.2 6.6Z"
          fill="var(--color-primary-fixed)"
        />
      </svg>
      {withWordmark && <span className={wordmarkClass}>Ember</span>}
    </div>
  )
}
