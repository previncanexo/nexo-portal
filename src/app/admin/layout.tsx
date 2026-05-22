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
    <div
      className="portal-dark min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/portal-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* Dark overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(10,3,40,0.88) 0%, rgba(18,5,61,0.80) 50%, rgba(45,18,102,0.84) 100%)',
          zIndex: 0,
        }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.18,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
          zIndex: 0,
        }}
      />
      <AdminNav />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4 sm:px-6 pb-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
