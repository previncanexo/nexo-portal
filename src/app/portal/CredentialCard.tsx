'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active: {
    label: 'Activo',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.15)',
    border: 'rgba(74,222,128,0.3)',
  },
  pending: {
    label: 'Pendiente',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.15)',
    border: 'rgba(250,204,21,0.3)',
  },
  suspended: {
    label: 'Suspendido',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.15)',
    border: 'rgba(251,146,60,0.3)',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.15)',
    border: 'rgba(248,113,113,0.3)',
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
    <div
      className="glass-card overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(134,96,239,0.2) 0%, rgba(238,92,208,0.2) 100%)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {/* Top gradient stripe */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, var(--purple) 0%, var(--pink) 100%)' }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: affiliate info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Afiliado
            </p>
            <h2
              className="text-2xl font-normal text-white leading-tight mb-3 truncate"
              style={{ fontFamily: 'var(--font-dm-serif)' }}
            >
              {affiliate
                ? `${affiliate.nombre} ${affiliate.apellido}`
                : 'Sin datos'}
            </h2>

            {/* Affiliate number */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                N° de afiliado
              </span>
              <span
                className="text-sm font-bold tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
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
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: statusCfg.color }}
                />
                {statusCfg.label}
              </div>

              {affiliate?.cobertura_hasta && (
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Cobertura hasta
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {formatDate(affiliate.cobertura_hasta)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: QR code */}
          <div
            className="shrink-0 p-2 rounded-xl"
            style={{ background: 'white' }}
          >
            <QRCode
              value={qrValue}
              size={80}
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
