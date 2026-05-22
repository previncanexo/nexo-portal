import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'

export const metadata = {
  title: 'Admin · Previnca',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/portal')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      {/* Override the portal's colorful gradient — admin uses a clean dark slate */}
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      <AdminNav />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4 sm:px-6 pb-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
