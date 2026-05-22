'use client'

import QRCode from 'react-qr-code'
import type { Affiliate } from '@/lib/types'

interface CredentialCardProps {
  affiliate: Affiliate | null
}

const STATUS_CONFIG = {
  active:    { label: 'Activo',     color: '#86efac', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'   },
  pending:   { label: 'Pendiente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.30)'  },
  suspended: { label: 'Suspendido', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.30)'  },
  cancelled: { label: 'Cancelado',  color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)'   },
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
      className="relative overflow-hidden"
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

      {/* Content */}
      <div className="relative px-5 pt-5 pb-5">
        {/* Header: brand + status badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Nexo by Previnca
          </p>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0"
            style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {/* Plan badge */}
            <div className="mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {affiliate?.plan?.name ?? 'Plan Base Nexo'}
              </span>
            </div>

            {/* Name */}
            <h2
              className="text-xl sm:text-2xl leading-tight mb-3 truncate"
              style={{ color: 'white', fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
            >
              {affiliate ? `${affiliate.nombre} ${affiliate.apellido}` : 'Sin datos'}
            </h2>

            {/* Affiliate number */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
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
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
              Verificar
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5 mb-4 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />

        {/* Coverage date */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {affiliate?.cobertura_hasta ? (
            <>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
                Vigente hasta
              </p>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.95)', fontFamily: 'var(--font-dm-sans)' }}>
                {formatDate(affiliate.cobertura_hasta)}
              </p>
            </>
          ) : (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
              Nexo by Previnca
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
