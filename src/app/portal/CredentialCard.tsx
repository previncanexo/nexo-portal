'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.2)'  },
  pending:   { label: 'Pendiente',  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)', border: 'rgba(202,138,4,0.2)' },
  suspended: { label: 'Suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.1)', border: 'rgba(234,88,12,0.2)' },
  cancelled: { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.2)' },
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
    <div className="glass-card overflow-hidden">
      {/* Gradient header */}
      <div
        className="px-5 pt-5 pb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)' }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Plan Base Nexo · Afiliado
            </p>
            <h2
              className="text-lg font-bold leading-tight mb-4 truncate"
              style={{ color: 'white', fontFamily: 'var(--font-dm-sans)' }}
            >
              {affiliate ? `${affiliate.nombre} ${affiliate.apellido}` : 'Sin datos'}
            </h2>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>N° de afiliado</p>
              <p
                className="text-xl font-bold tracking-wider break-all"
                style={{ fontFamily: 'monospace', color: 'white' }}
              >
                {affiliate?.affiliate_number ?? '—'}
              </p>
            </div>
          </div>

          {/* QR — solo en pantallas medianas+ */}
          <div className="hidden sm:flex shrink-0 flex-col items-center gap-1.5">
            <div className="p-1.5 rounded-xl" style={{ background: 'white' }}>
              <QRCode value={qrValue} size={68} style={{ display: 'block' }} />
            </div>
            <p className="text-center" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem' }}>
              Escaneá para verificar
            </p>
          </div>
        </div>
      </div>

      {/* Status + dates */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
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

        {affiliate?.cobertura_hasta && (
          <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
            Hasta{' '}
            <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
              {formatDate(affiliate.cobertura_hasta)}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
