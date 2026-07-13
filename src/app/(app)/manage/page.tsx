'use client'

import Link from 'next/link'
import { ChevronRight, Brain, Dumbbell, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ManagePage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-[480px] px-margin-x pt-4">
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-text-primary">Manage</h2>
        <p className="font-body-sm text-body-sm text-text-secondary mt-1">Configure your tracker ecosystem.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/manage/habits"
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-surface p-4 transition-colors hover:bg-surface-elevated active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-text-primary">Habits</p>
              <p className="font-body-sm text-body-sm text-text-secondary">Edit trackers & rules</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 h-5 w-5 text-outline transition-colors group-hover:text-primary" />
        </Link>

        <Link
          href="/manage/exercises"
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-surface p-4 transition-colors hover:bg-surface-elevated active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-secondary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-text-primary">Exercise Library</p>
              <p className="font-body-sm text-body-sm text-text-secondary">Custom movements & history</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 h-5 w-5 text-outline transition-colors group-hover:text-secondary" />
        </Link>

        <Link
          href="/manage/templates"
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-surface p-4 transition-colors hover:bg-surface-elevated active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-tertiary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-tertiary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-text-primary">Workout Templates</p>
              <p className="font-body-sm text-body-sm text-text-secondary">Pre-built training routines</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 h-5 w-5 text-outline transition-colors group-hover:text-tertiary" />
        </Link>
      </div>

      <div className="mt-12">
        <button
          onClick={handleSignOut}
          className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-destructive bg-transparent font-headline-md text-headline-md text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
