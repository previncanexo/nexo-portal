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
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(145deg, #1a2340 0%, #16213e 50%, #1a1f38 100%)',
        }}
      />
      <AdminNav />
      <main className="flex-1 relative z-10 px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
