'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active:    { label: 'Activo',     color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.25)'  },
  pending:   { label: 'Pendiente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.25)' },
  suspended: { label: 'Suspendido', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.25)' },
  cancelled: { label: 'Cancelado',  color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.25)' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CredentialCard({ affiliate }: CredentialCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const qrValue = affiliate?.affiliate_number
    ? `${appUrl}/verificar/${affiliate.affiliate_number}`
    : `${appUrl}/verificar`
  const status = affiliate?.status ?? 'pending'
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, var(--purple) 0%, #5b3fb5 50%, var(--pink) 100%)',
        boxShadow: '0 8px 32px rgba(134,96,239,0.35), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Content */}
      <div className="relative px-5 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">

          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {/* Plan badge */}
            <div className="inline-flex items-center gap-1.5 mb-4">
              <span
                className="text-xs sm:text-sm font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Plan Base Nexo
              </span>
            </div>

            {/* Name */}
            <h2
              className="text-xl sm:text-2xl font-bold leading-tight mb-4 truncate"
              style={{ color: 'white', fontFamily: 'var(--font-dm-sans)' }}
            >
              {affiliate ? `${affiliate.nombre} ${affiliate.apellido}` : 'Sin datos'}
            </h2>

            {/* Affiliate number */}
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                N° de afiliado
              </p>
              <p
                className="text-2xl sm:text-3xl font-bold tracking-wider break-all"
                style={{ fontFamily: 'monospace', color: 'white', letterSpacing: '0.1em' }}
              >
                {affiliate?.affiliate_number ?? '—'}
              </p>
            </div>
          </div>

          {/* Right: QR */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <QRCode value={qrValue} size={60} style={{ display: 'block' }} />
            </div>
            <p className="text-xs sm:text-sm text-center" style={{ color: 'rgba(255,255,255,0.68)' }}>
              Verificar
            </p>
          </div>

        </div>

        {/* Divider */}
        <div className="mt-5 mb-4 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

        {/* Status + date */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold"
            style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}
          >
            {status === 'active' ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: statusCfg.color }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: statusCfg.color }} />
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.color }} />
            )}
            {statusCfg.label}
          </div>

          {affiliate?.cobertura_hasta ? (
            <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Hasta{' '}
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {formatDate(affiliate.cobertura_hasta)}
              </span>
            </p>
          ) : (
            <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.68)' }}>Nexo by Previnca</p>
          )}
        </div>
      </div>
    </div>
  )
}
