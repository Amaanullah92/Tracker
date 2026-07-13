'use client'

import { Calendar, Dumbbell, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/today', label: 'Today', icon: Calendar },
  { href: '/gym', label: 'Gym', icon: Dumbbell },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/manage', label: 'Manage', icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
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
    </nav>
  )
}
