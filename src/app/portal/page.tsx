import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Affiliate, Payment } from '@/lib/types'
import CredentialWithDownload from './CredentialWithDownload'
import ServiceCards from './ServiceCards'
import CancelSection from './CancelSection'
import PaymentHistory from './PaymentHistory'
import RetryPaymentButton from './RetryPaymentButton'
import ActiveWatcher from './ActiveWatcher'

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_SUPPORT ?? '5493415056130'

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

  const firstName = affiliate.nombre
  const status = affiliate.status as 'pending' | 'active' | 'suspended' | 'cancelled'
  const isPending = status === 'pending'
  const isActive = status === 'active'
  const isSuspended = status === 'suspended'
  const isCancelled = status === 'cancelled'

  let payments: Payment[] = []
  if (affiliate.id) {
    const adminClient = createAdminClient()
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

      {isSuspended && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.30)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fb923c' }}>
              Tu cuenta está suspendida
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(251,146,60,0.80)' }}>
              Tu acceso a los servicios está temporalmente suspendido. Contactate con Nexo para regularizar tu situación.
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Hola%2C%20mi%20cuenta%20est%C3%A1%20suspendida%20y%20necesito%20ayuda`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold"
              style={{ color: '#fb923c' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
      {isCancelled && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
              Tu suscripción fue cancelada
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(248,113,113,0.80)' }}>
              Tu afiliación a Nexo está cancelada. Si querés reactivarla, contactate con nosotros.
            </p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Hola%2C%20quiero%20reactivar%20mi%20afiliaci%C3%B3n%20a%20Nexo`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold"
              style={{ color: '#f87171' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Credencial */}
      {isActive && (
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
      <section>
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          Tus servicios
        </p>
        {isActive ? (
          <ServiceCards affiliate={affiliate as Affiliate | null} />
        ) : (
          <div
            className="glass-card px-5 py-6 flex items-center gap-4"
          >
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
                Tus servicios estarán disponibles cuando tu cuenta esté activa.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Historial de pagos */}
      <section>
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          Historial de pagos
        </p>
        <PaymentHistory payments={payments} />
      </section>

      {/* Cancelar suscripción */}
      <CancelSection status={status} />

    </div>
  )
}
