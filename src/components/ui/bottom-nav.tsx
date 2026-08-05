'use client'

import { Calendar, Dumbbell, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSyncStatus } from '@/lib/sync-context'

const navItems = [
  { href: '/today', label: 'Today', icon: Calendar },
  { href: '/gym', label: 'Gym', icon: Dumbbell },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/manage', label: 'Manage', icon: Settings },
] as const

function SyncDot() {
  const status = useSyncStatus()
  const router = useRouter()

  if (status === 'idle') return null

  const actionable = status === 'conflicts'
  const dotClass =
    status === 'syncing'
      ? 'bg-tertiary animate-pulse'
      : status === 'conflicts' || status === 'failed'
        ? 'bg-destructive'
        : 'bg-text-tertiary'

  return (
    <div className="absolute right-3 top-2 z-10">
      <button
        onClick={actionable ? () => router.push('/sync/conflicts') : undefined}
        disabled={!actionable}
        className={`ring-focus flex h-9 min-w-9 items-center justify-center rounded-full transition-colors ${
          actionable ? 'cursor-pointer bg-destructive/10 hover:bg-destructive/20' : 'cursor-default bg-transparent'
        }`}
        aria-label={
          status === 'syncing'
            ? 'Syncing…'
            : status === 'conflicts'
              ? 'Sync conflicts — tap to review'
              : status === 'failed'
                ? 'Sync failed'
                : 'Offline'
        }
      >
        <span className={`block h-3 w-3 rounded-full ring-2 ring-bg ${dotClass}`} />
      </button>
    </div>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-lg items-center px-2">
        <div className="flex flex-1 items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`ring-focus relative flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-3 transition-colors duration-150 active:scale-[0.96] ${
                  isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                <span className="font-display text-[13px] font-semibold uppercase tracking-wide">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
      <SyncDot />
    </nav>
  )
}
