import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import CredentialCard from './CredentialCard'
import ServiceCards from './ServiceCards'

function getGreeting(): string {
  // Argentina is UTC-3
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours()
  if (hour >= 6 && hour < 13) return 'Buenos días'
  if (hour >= 13 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function PortalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  const firstName = affiliate?.nombre ?? 'Afiliado'
  const greeting = getGreeting()

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Welcome */}
      <div className="pt-1 pb-2">
        <p
          className="text-2xl font-semibold text-white"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {greeting}, {firstName}
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Aquí están todos tus beneficios de salud.
        </p>
      </div>

      <CredentialCard affiliate={affiliate as Affiliate | null} />
      <ServiceCards affiliate={affiliate as Affiliate | null} />

      {/* Próximamente */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
            Próximamente
          </p>
        </div>
        <div className="px-5 py-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(134,96,239,0.1)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
              A la Carta
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>
              Sumá servicios adicionales según tus necesidades.
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)' }}
          >
            Pronto
          </span>
        </div>
      </div>
    </div>
  )
}
