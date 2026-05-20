import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import PortalHeader from './PortalHeader'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader affiliate={affiliate as Affiliate | null} />
      <main className="flex-1 relative z-10 px-4 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
