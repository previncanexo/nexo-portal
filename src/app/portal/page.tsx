import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Affiliate } from '@/lib/types'
import CredentialCard from './CredentialCard'
import ServiceCards from './ServiceCards'
import CancelSection from './CancelSection'

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
    <div className="flex flex-col gap-7 pb-10">

      {/* Saludo */}
      <div className="pt-1">
        <p
          className="text-xs font-medium mb-1"
          style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {getGreeting()}
        </p>
        <h1
          className="text-2xl sm:text-3xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {firstName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Todos tus beneficios en un solo lugar.
        </p>
      </div>

      {/* Credencial */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Tu credencial
        </p>
        <CredentialCard affiliate={affiliate as Affiliate | null} />
      </section>

      {/* Servicios */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Tus servicios
        </p>
        <ServiceCards affiliate={affiliate as Affiliate | null} />
      </section>

      {/* Próximamente */}
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Próximamente
        </p>
        <div className="glass-card px-5 py-4 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(134,96,239,0.1)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
              Servicios A la Carta
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>
              Sumá coberturas adicionales a tu plan.
            </p>
          </div>
          <span
            className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide"
            style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)' }}
          >
            Pronto
          </span>
        </div>
      </section>

      {/* Cancelar suscripción */}
      <CancelSection />

    </div>
  )
}
