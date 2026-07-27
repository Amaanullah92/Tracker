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

  return (
    <div className="absolute right-5 top-1/2 z-10 -translate-y-1/2">
      <button
        onClick={actionable ? () => router.push('/sync/conflicts') : undefined}
        disabled={!actionable}
        className={`flex items-center justify-center rounded-full p-1 outline-none transition-colors ${
          actionable ? 'cursor-pointer hover:bg-bg-secondary' : 'cursor-default'
        }`}
        aria-label={`Sync status: ${status}`}
      >
        <span
          className={`block h-3 w-3 rounded-full ${
            status === 'syncing'
              ? 'bg-blue-500 animate-pulse'
              : status === 'conflicts'
                ? 'bg-amber-500'
                : status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
          }`}
        />
      </button>
    </div>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] relative">
      <div className="mx-auto flex h-16 max-w-lg items-center px-2">
        <div className="flex flex-1 items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
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
