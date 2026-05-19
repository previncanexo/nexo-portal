'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
  pending:   { label: 'Pendiente',  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',  border: 'rgba(202,138,4,0.2)'  },
  suspended: { label: 'Suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.1)',  border: 'rgba(234,88,12,0.2)'  },
  cancelled: { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.2)'  },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CredentialCard({ affiliate }: CredentialCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const status = affiliate?.status ?? 'pending'
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <div className="glass-card overflow-hidden">
      {/* Gradient accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, var(--purple) 0%, var(--pink) 100%)' }}
      />

      <div className="p-5">
        {/* Top row: plan badge + status */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--gray-400)' }}
          >
            Plan Base Nexo
          </span>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
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
        </div>

        {/* Main content */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h2
              className="text-2xl font-normal leading-snug mb-3 truncate"
              style={{ fontFamily: 'var(--font-dm-serif)', color: 'var(--gray-900)' }}
            >
              {affiliate ? `${affiliate.nombre} ${affiliate.apellido}` : 'Sin datos'}
            </h2>

            {/* Affiliate number */}
            <div className="mb-4">
              <p className="text-xs mb-1" style={{ color: 'var(--gray-400)' }}>N° de afiliado</p>
              <p
                className="text-xl font-bold tracking-widest"
                style={{
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {affiliate?.affiliate_number ?? '—'}
              </p>
            </div>

            {/* Dates */}
            {(affiliate?.cobertura_desde || affiliate?.cobertura_hasta) && (
              <div className="flex flex-col gap-1">
                {affiliate?.cobertura_desde && (
                  <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
                    Desde{' '}
                    <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                      {formatDate(affiliate.cobertura_desde)}
                    </span>
                  </p>
                )}
                {affiliate?.cobertura_hasta && (
                  <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
                    Hasta{' '}
                    <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                      {formatDate(affiliate.cobertura_hasta)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* QR */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div
              className="p-2 rounded-xl"
              style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}
            >
              <QRCode value={`${appUrl}/portal`} size={72} style={{ display: 'block' }} />
            </div>
            <p className="text-center text-xs" style={{ color: 'var(--gray-400)', fontSize: '0.6rem' }}>
              Escaneá para verificar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
