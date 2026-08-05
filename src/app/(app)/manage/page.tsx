'use client'

import Link from 'next/link'
import { ChevronRight, Brain, Dumbbell, FileText, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/ui/app-header'

export default function ManagePage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const sections = [
    {
      href: '/manage/habits',
      title: 'Habits',
      subtitle: 'Edit trackers & rules',
      icon: Brain,
      tileClass: 'bg-primary/15 text-primary',
      hoverClass: 'group-hover:border-primary/40',
    },
    {
      href: '/manage/exercises',
      title: 'Exercise Library',
      subtitle: 'Custom movements & history',
      icon: Dumbbell,
      tileClass: 'bg-secondary-container/40 text-secondary',
      hoverClass: 'group-hover:border-secondary/40',
    },
    {
      href: '/manage/templates',
      title: 'Workout Templates',
      subtitle: 'Pre-built training routines',
      icon: FileText,
      tileClass: 'bg-tertiary-container/40 text-tertiary',
      hoverClass: 'group-hover:border-tertiary/40',
    },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-3 px-margin-x pb-24">
      <AppHeader title="Manage" eyebrow="Configure your tracker" />

      <div className="space-y-3">
        {sections.map(({ href, title, subtitle, icon: Icon, tileClass, hoverClass }) => (
          <Link
            key={href}
            href={href}
            className={`ring-focus press group flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-variant ${hoverClass}`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tileClass}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-display text-headline text-headline text-text-primary">{title}</p>
                <p className="text-sm text-text-secondary">{subtitle}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-outline transition-colors group-hover:text-text-primary" aria-hidden />
          </Link>
        ))}
      </div>

      <div className="pt-8">
        <button
          onClick={handleSignOut}
          className="ring-focus press flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-transparent font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </button>
      </div>
    </div>
  )
}
