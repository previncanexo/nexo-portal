import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AffiliateStatus } from '@/lib/types'
import { formatDateAR } from '@/lib/dateUtils'

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string; icon: 'check' | 'clock' | 'x' }> = {
  active:    { label: 'Afiliado activo',          color: '#86efac', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   icon: 'check' },
  pending:   { label: 'Pendiente de activación',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.30)',  icon: 'clock' },
  suspended: { label: 'Afiliado suspendido',      color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.30)',  icon: 'x'     },
  cancelled: { label: 'Afiliado cancelado',       color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)',   icon: 'x'     },
}

function formatDate(dateStr: string | null): string {
  return formatDateAR(dateStr, { day: '2-digit', month: 'long', year: 'numeric' })
}

function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Orb purple */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px',
          left: '-120px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'var(--purple)',
          opacity: 0.06,
          filter: 'blur(130px)',
        }}
      />
      {/* Orb pink */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-100px',
          right: '-100px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'var(--pink)',
          opacity: 0.05,
          filter: 'blur(110px)',
        }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.15,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Previnca Nexo"
            width={220}
            height={88}
            style={{ objectFit: 'contain', height: '72px', width: 'auto', margin: '0 auto' }}
            priority
          />
        </div>

        {!affiliate ? (
          /* Not found */
          <div className="glass-card p-7 sm:p-8 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171' }}
            >
              <IconX />
            </div>
            <h2
              className="text-2xl text-white mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
            >
              No encontrado
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
              El número <span className="font-bold text-white">{numero}</span> no corresponde a ningún afiliado registrado en Nexo.
            </p>
          </div>
        ) : (
          /* Found — credential card */
          <div>
            {/* Credential card with brand gradient */}
            <div
              className="relative overflow-hidden mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--purple) 0%, #5b3fb5 50%, var(--pink) 100%)',
                borderRadius: '20px',
                boxShadow: '0 12px 40px rgba(134,96,239,0.40), 0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* Decorative arcs */}
              <svg
                className="absolute pointer-events-none"
                style={{ top: '-20px', right: '-20px', opacity: 0.12 }}
                width="180"
                height="180"
                viewBox="0 0 180 180"
                fill="none"
              >
                <ellipse cx="160" cy="20" rx="100" ry="100" stroke="white" strokeWidth="1.5" />
                <ellipse cx="160" cy="20" rx="70" ry="70" stroke="white" strokeWidth="1" />
                <ellipse cx="160" cy="20" rx="42" ry="42" stroke="white" strokeWidth="0.75" />
              </svg>

              {/* Grain texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.08,
                  mixBlendMode: 'overlay',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'repeat',
                  backgroundSize: '128px 128px',
                }}
              />

              <div className="relative p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
                    Previnca Nexo
                  </p>
                  {planName && (
                    <span
                      className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {planName}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2
                  className="text-xl sm:text-2xl leading-tight mb-1"
                  style={{ color: 'white', fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
                >
                  {affiliate.nombre} {affiliate.apellido}
                </h2>

                {/* Affiliate number */}
                <p className="text-xs uppercase tracking-widest mb-1 mt-3" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
                  N° de afiliado
                </p>
                <p
                  className="text-2xl font-bold tracking-wider break-all"
                  style={{ fontFamily: 'monospace', color: 'white', letterSpacing: '0.1em' }}
                >
                  {affiliate.affiliate_number}
                </p>

                <div className="mt-4 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

                {/* Coverage */}
                {(affiliate.cobertura_desde || affiliate.cobertura_hasta) && (
                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    {affiliate.cobertura_desde && (
                      <div>
                        <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>Desde</p>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{formatDate(affiliate.cobertura_desde)}</p>
                      </div>
                    )}
                    {affiliate.cobertura_hasta && (
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>Hasta</p>
                        <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{formatDate(affiliate.cobertura_hasta)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status banner */}
            {statusCfg && (
              <div
                className="glass-card rounded-2xl px-4 py-4 flex items-start gap-3"
                style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
              >
                <div className="mt-0.5 shrink-0" style={{ color: statusCfg.color }}>
                  {statusCfg.icon === 'check' && <IconCheck />}
                  {statusCfg.icon === 'clock' && <IconClock />}
                  {statusCfg.icon === 'x' && <IconX />}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: statusCfg.color, fontFamily: 'var(--font-dm-sans)' }}>
                    {statusCfg.label}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: statusCfg.color, opacity: 0.80, fontFamily: 'var(--font-dm-sans)' }}>
                    Verificación oficial · Previnca Nexo
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>
              {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
