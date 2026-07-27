import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/ui/bottom-nav'
import { SyncSetup } from '@/components/sync/sync-setup'
import { SyncProvider } from '@/lib/sync-context'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <SyncProvider>
      <SyncSetup />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </SyncProvider>
  )
}