import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import PortalHeader from './PortalHeader'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)',
      }}
    >
      {/* Decorative orbs */}
      <div
        className="fixed top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--purple)' }}
      />
      <div
        className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--pink)' }}
      />
      <div
        className="fixed top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--pink)' }}
      />

      <PortalHeader affiliate={affiliate as Affiliate | null} />

      <main className="flex-1 relative z-10 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
