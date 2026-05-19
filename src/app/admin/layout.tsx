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
      <AdminNav />
      <main className="flex-1 relative z-10 px-4 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
