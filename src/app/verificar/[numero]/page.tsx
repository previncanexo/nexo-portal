import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AffiliateStatus } from '@/lib/types'

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string; icon: 'check' | 'clock' | 'x' }> = {
  active:    { label: 'Afiliado activo',    color: '#16a34a', bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.3)',  icon: 'check' },
  pending:   { label: 'Pendiente de activación', color: '#ca8a04', bg: 'rgba(202,138,4,0.12)', border: 'rgba(202,138,4,0.3)', icon: 'clock' },
  suspended: { label: 'Afiliado suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.3)', icon: 'x' },
  cancelled: { label: 'Afiliado cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)', icon: 'x' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function IconCheck() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export default async function VerificarPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, apellido, affiliate_number, status, cobertura_desde, cobertura_hasta, plan:plans(name)')
    .eq('affiliate_number', numero.toUpperCase())
    .single()

  const status = (affiliate?.status ?? null) as AffiliateStatus | null
  const statusCfg = status ? STATUS_CONFIG[status] : null

  const rawPlan = (affiliate as any)?.plan
  const planName: string | null = rawPlan
    ? (Array.isArray(rawPlan) ? (rawPlan[0]?.name ?? null) : rawPlan.name ?? null)
    : null

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Nexo by Previnca"
            width={160}
            height={64}
            style={{ objectFit: 'contain', height: '56px', width: 'auto', margin: '0 auto' }}
            priority
          />
        </div>

        {!affiliate ? (
          /* Not found */
          <div
            className="rounded-3xl p-6 sm:p-8 text-center"
            style={{
              background: 'rgba(134,96,239,0.55)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)' }}
            >
              <IconX />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Afiliado no encontrado
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              El número <span className="font-bold text-white">{numero}</span> no corresponde a ningún afiliado registrado en Nexo.
            </p>
          </div>
        ) : (
          /* Found */
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(255,255,255,0.6)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* Gradient top bar */}
            <div
              className="h-2 w-full"
              style={{ background: 'linear-gradient(90deg, var(--purple) 0%, var(--pink) 100%)' }}
            />

            <div className="p-5 sm:p-7">
              {/* Status badge — lo más importante para el verificador */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6"
                style={{ background: statusCfg?.bg, border: `1px solid ${statusCfg?.border}` }}
              >
                <div style={{ color: statusCfg?.color }}>
                  {statusCfg?.icon === 'check' && <IconCheck />}
                  {statusCfg?.icon === 'clock' && <IconClock />}
                  {statusCfg?.icon === 'x' && <IconX />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: statusCfg?.color }}>
                    {statusCfg?.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>
                    {planName ?? 'Nexo by Previnca'}
                  </p>
                </div>
              </div>

              {/* Affiliate info */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-400)' }}>
                    Afiliado
                  </p>
                  <p className="text-xl font-bold leading-snug" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                    {affiliate.nombre} {affiliate.apellido}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-400)' }}>
                    N° de afiliado
                  </p>
                  <p
                    className="text-xl font-bold tracking-wider break-all"
                    style={{
                      fontFamily: 'monospace',
                      background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {affiliate.affiliate_number}
                  </p>
                </div>

                {/* Coverage dates */}
                {(affiliate.cobertura_desde || affiliate.cobertura_hasta) && (
                  <div
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
                      Vigencia de cobertura
                    </p>
                    {affiliate.cobertura_desde && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'var(--gray-500)' }}>Desde</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--gray-800)' }}>
                          {formatDate(affiliate.cobertura_desde)}
                        </span>
                      </div>
                    )}
                    {affiliate.cobertura_hasta && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'var(--gray-500)' }}>Hasta</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--gray-800)' }}>
                          {formatDate(affiliate.cobertura_hasta)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="mt-6 pt-5 text-center"
                style={{ borderTop: '1px solid var(--gray-100)' }}
              >
                <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                  Verificación oficial · Nexo by Previnca
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gray-300)' }}>
                  {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
