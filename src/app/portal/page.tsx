import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import CredentialCard from './CredentialCard'
import ServiceCards from './ServiceCards'

function getGreeting(): string {
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours()
  if (hour >= 6 && hour < 13) return 'Buenos días'
  if (hour >= 13 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function PortalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  const firstName = affiliate?.nombre ?? 'Afiliado'

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Saludo */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {getGreeting()}
        </p>
        <h1
          className="text-2xl sm:text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {firstName}
        </h1>
      </div>

      {/* Credencial */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Tu credencial
        </p>
        <CredentialCard affiliate={affiliate as Affiliate | null} />
      </section>

      {/* Servicios */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Tus servicios
        </p>
        <ServiceCards affiliate={affiliate as Affiliate | null} />
      </section>

      {/* Próximamente */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Próximamente
        </p>
        <div className="glass-card px-5 py-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(134,96,239,0.1)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
              A la Carta
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>
              Sumá servicios adicionales a tu plan.
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)' }}
          >
            Pronto
          </span>
        </div>
      </section>

    </div>
  )
}
