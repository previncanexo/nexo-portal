import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncMpPaymentsForAffiliate } from '@/lib/mpSync'
import type { Affiliate, Payment } from '@/lib/types'
import CredentialWithDownload from './CredentialWithDownload'
import ServiceCards from './ServiceCards'
import CancelSection from './CancelSection'
import ReactivateButton from './ReactivateButton'
import RetryPaymentButton from './RetryPaymentButton'
import ActiveWatcher from './ActiveWatcher'

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

  const adminClient = createAdminClient()

  let { data: affiliate } = await supabase
    .from('affiliates')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <p className="text-base font-semibold text-white">No encontramos tu afiliación.</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          Si creés que es un error, contactate con Nexo para resolver tu situación.
        </p>
      </div>
    )
  }

  const status = affiliate.status as 'pending' | 'active' | 'suspended' | 'cancelled'
  const isPending = status === 'pending'

  // Fallback lazy sync: si aparece sin cobertura vigente pero MP le sigue
  // cobrando (webhook perdido, subs viejas con plan template), consultamos MP
  // y registramos los pagos faltantes antes de renderizar el portal.
  const now = new Date()
  const preliminaryCoberturaHasta = affiliate.cobertura_hasta ? new Date(affiliate.cobertura_hasta + 'T23:59:59') : null
  const preliminaryVigente = !!preliminaryCoberturaHasta && preliminaryCoberturaHasta >= now

  if (!preliminaryVigente && !isPending && affiliate.mp_subscription_id) {
    const { synced } = await syncMpPaymentsForAffiliate(adminClient, {
      id: affiliate.id,
      mp_subscription_id: affiliate.mp_subscription_id,
      cobertura_hasta: affiliate.cobertura_hasta,
    })
    if (synced > 0) {
      const { data: refetched } = await supabase
        .from('affiliates')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .single()
      if (refetched) affiliate = refetched
    }
  }

  const firstName = affiliate.nombre
  const coberturaHasta = affiliate.cobertura_hasta ? new Date(affiliate.cobertura_hasta + 'T23:59:59') : null
  const tieneCobertura = !!coberturaHasta && coberturaHasta >= now
  const cancelRequested = !!affiliate.cancel_requested_at

  // Bloqueo real: sin cobertura vigente Y en estado terminal.
  const bloqueadoSinCobertura = !tieneCobertura && (status === 'suspended' || status === 'cancelled')

  const coberturaHastaLabel = coberturaHasta
    ? coberturaHasta.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  let payments: Payment[] = []
  if (affiliate.id) {
    const { data } = await adminClient
      .from('payments')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(24)
    payments = (data ?? []) as Payment[]
  }

  // Pending: show focused payment screen instead of locked portal
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Completá tu pago
          </h1>
          <p className="text-sm sm:text-base max-w-sm" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu cuenta está registrada pero el pago no fue confirmado todavía. Completá el pago para activar todos tus beneficios.
          </p>
        </div>

        <RetryPaymentButton email={affiliate.email} />

        <a
          href="/registro"
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          Volver a registrarse con otros datos
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7 pb-10">

      {/* Saludo */}
      <div className="pt-1">
        <p
          className="text-sm sm:text-base font-medium mb-1"
          style={{ color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {getGreeting()}
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {firstName} 👋
        </h1>
        <p className="text-sm sm:text-base mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Todos tus beneficios en un solo lugar.
        </p>
      </div>

      {tieneCobertura && cancelRequested && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
              Cancelaste tu suscripción
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(251,191,36,0.85)' }}>
              Seguís teniendo acceso a todos los beneficios hasta el <strong>{coberturaHastaLabel}</strong>. Después de esa fecha se dan de baja.
            </p>
            <ReactivateButton variant="ghost" />
          </div>
        </div>
      )}

      {bloqueadoSinCobertura && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
              Tu cobertura finalizó
            </p>
            <p className="text-sm mt-0.5 mb-2" style={{ color: 'rgba(248,113,113,0.80)' }}>
              El período contratado ya venció. Reactivá tu suscripción para recuperar el acceso.
            </p>
            <ReactivateButton variant="primary" />
          </div>
        </div>
      )}

      {/* Credencial */}
      {tieneCobertura && (
        <section>
          <p
            className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.70)' }}
          >
            Tu credencial
          </p>
          <CredentialWithDownload affiliate={affiliate as Affiliate} />
        </section>
      )}

      {/* Servicios */}
      {tieneCobertura ? (
        <ServiceCards affiliate={affiliate as Affiliate | null} />
      ) : (
        <section>
          <p
            className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.70)' }}
          >
            Tus servicios
          </p>
          <div className="glass-card px-5 py-6 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(251,191,36,0.1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                Servicios no disponibles
              </p>
              <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--gray-500)' }}>
                Tu cobertura finalizó. Contactanos para reactivarla.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Cancelar suscripción */}
      <CancelSection status={status} cancelRequested={cancelRequested} coberturaHastaLabel={coberturaHastaLabel} />

    </div>
  )
}
