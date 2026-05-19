'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active: {
    label: 'Activo',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.12)',
    border: 'rgba(22,163,74,0.25)',
  },
  pending: {
    label: 'Pendiente',
    color: '#ca8a04',
    bg: 'rgba(202,138,4,0.12)',
    border: 'rgba(202,138,4,0.25)',
  },
  suspended: {
    label: 'Suspendido',
    color: '#ea580c',
    bg: 'rgba(234,88,12,0.12)',
    border: 'rgba(234,88,12,0.25)',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.25)',
  },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function CredentialCard({ affiliate }: CredentialCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const qrValue = `${appUrl}/portal`

  const status = affiliate?.status ?? 'pending'
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  const fullName = affiliate
    ? `${affiliate.nombre} ${affiliate.apellido}`
    : 'Sin datos'

  return (
    <div className="glass-card overflow-hidden">
      {/* Gradient header */}
      <div
        className="px-6 pt-6 pb-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
        }}
      >
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Plan Base Nexo
            </p>
            <h2
              className="text-2xl font-normal leading-tight mb-3 truncate"
              style={{ fontFamily: 'var(--font-dm-serif)', color: 'white' }}
            >
              {fullName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>N°</span>
              <span
                className="text-lg font-bold tracking-widest"
                style={{ fontFamily: 'monospace', color: 'white' }}
              >
                {affiliate?.affiliate_number ?? '—'}
              </span>
            </div>
          </div>

          {/* QR */}
          <div className="shrink-0">
            <div className="p-1.5 rounded-xl" style={{ background: 'white' }}>
              <QRCode value={qrValue} size={68} style={{ display: 'block' }} />
            </div>
          </div>
        </div>
      </div>

      {/* White lower section */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Status */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            color: statusCfg.color,
          }}
        >
          {status === 'active' ? (
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: statusCfg.color }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: statusCfg.color }} />
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.color }} />
          )}
          {statusCfg.label}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--gray-500)' }}>
          {affiliate?.cobertura_desde && (
            <span>
              Desde{' '}
              <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                {formatDate(affiliate.cobertura_desde)}
              </span>
            </span>
          )}
          {affiliate?.cobertura_hasta && (
            <span>
              Hasta{' '}
              <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                {formatDate(affiliate.cobertura_hasta)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
