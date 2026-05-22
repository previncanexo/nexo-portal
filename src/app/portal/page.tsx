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

      {/* Banner estado no activo */}
      {isPending && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
              Tu pago está siendo procesado
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(251,191,36,0.80)' }}>
              Tu cuenta se activará automáticamente en cuanto confirmemos el pago. Si no completaste el pago, podés hacerlo ahora.
            </p>
            <RetryPaymentButton />
          </div>
        </div>
      )}
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
          </div>
        </div>
      )}

      {/* Credencial */}
      <section>
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.70)' }}
        >
          Tu credencial
        </p>
        <CredentialWithDownload affiliate={affiliate as Affiliate} />
      </section>

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

      {/* Próximamente */}
      <section>
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.70)' }}
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
            <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
              Servicios A la Carta
            </p>
            <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--gray-500)' }}>
              Sumá coberturas adicionales a tu plan.
            </p>
          </div>
          <span
            className="shrink-0 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wide"
            style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)' }}
          >
            Pronto
          </span>
        </div>
      </section>

      {/* Cancelar suscripción */}
      <CancelSection status={status} />

      {/* Realtime: auto-refresh when pending → active */}
      {isPending && <ActiveWatcher affiliateId={affiliate.id} />}

    </div>
  )
}
