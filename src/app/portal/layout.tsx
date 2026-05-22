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
    <div
      className="portal-dark min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/portal-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(10,3,40,0.72) 0%, rgba(18,5,61,0.60) 50%, rgba(45,18,102,0.65) 100%)',
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

      <PortalHeader affiliate={affiliate as Affiliate | null} />
      <main className="flex-1 relative z-10 pt-20 sm:pt-24 px-4 sm:px-6 pb-10 max-w-[680px] mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
