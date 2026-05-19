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
    bg: 'rgba(22,163,74,0.1)',
    border: 'rgba(22,163,74,0.3)',
  },
  pending: {
    label: 'Pendiente',
    color: '#ca8a04',
    bg: 'rgba(202,138,4,0.1)',
    border: 'rgba(202,138,4,0.3)',
  },
  suspended: {
    label: 'Suspendido',
    color: '#ea580c',
    bg: 'rgba(234,88,12,0.1)',
    border: 'rgba(234,88,12,0.3)',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.3)',
  },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function CredentialCard({ affiliate }: CredentialCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const qrValue = `${appUrl}/portal`

  const status = affiliate?.status ?? 'pending'
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <div className="glass-card overflow-hidden">
      {/* Top gradient stripe */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--purple) 0%, var(--pink) 100%)' }}
      />

      <div className="p-6">
        {/* Plan badge + affiliate label row */}
        <div className="flex items-start justify-between mb-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--gray-500)' }}
          >
            Afiliado
          </p>
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
              color: 'white',
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
            }}
          >
            Plan Base Nexo
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          {/* Left: affiliate info */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl font-normal leading-tight mb-3 truncate"
              style={{ fontFamily: 'var(--font-dm-serif)', color: 'var(--gray-900)' }}
            >
              {affiliate
                ? `${affiliate.nombre} ${affiliate.apellido}`
                : 'Sin datos'}
            </h2>

            {/* Affiliate number */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4"
              style={{
                background: 'var(--gray-100)',
                border: '1px solid var(--gray-200)',
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--gray-500)' }}
              >
                N° de afiliado
              </span>
              <span
                className="text-base font-bold tracking-widest"
                style={{
                  fontFamily: 'monospace',
                  color: 'var(--purple)',
                }}
              >
                {affiliate?.affiliate_number ?? '—'}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
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
                    <span
                      className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ background: statusCfg.color }}
                    />
                  </span>
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: statusCfg.color }}
                  />
                )}
                {statusCfg.label}
              </div>

              {affiliate?.cobertura_hasta && (
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
                    Cobertura hasta
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--gray-700)' }}>
                    {formatDate(affiliate.cobertura_hasta)}
                  </span>
                </div>
              )}
            </div>

            {affiliate?.cobertura_desde && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
                  Cobertura activa desde:
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--gray-700)' }}>
                  {formatDate(affiliate.cobertura_desde)}
                </span>
              </div>
            )}
          </div>

          {/* Right: QR code */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div
              className="p-2 rounded-xl"
              style={{ background: 'white', border: '1px solid var(--gray-200)' }}
            >
              <QRCode
                value={qrValue}
                size={80}
                style={{ display: 'block' }}
              />
            </div>
            <span
              className="text-center"
              style={{ color: 'var(--gray-500)', fontSize: '0.6rem', lineHeight: '1.2' }}
            >
              Escaneá para verificar
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-5"
          style={{ height: '1px', background: 'var(--gray-200)' }}
        />
      </div>
    </div>
  )
}
