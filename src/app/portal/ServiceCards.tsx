'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

function IconDOC24({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function IconUrgencias({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 4.27l-4.12 2.6A2 2 0 0 0 2.5 8.6v6.8a2 2 0 0 0 .88 1.66l7.5 5a2 2 0 0 0 2.24 0l7.5-5a2 2 0 0 0 .88-1.66V8.6a2 2 0 0 0-.88-1.73L16.5 4.27a2 2 0 0 0-2.24 0z"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function IconFarmacias({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1h3a1.5 1.5 0 0 1 1.5 1.5V5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2.5A1.5 1.5 0 0 1 10.5 1z"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
      <path d="M10.5 1v4M13.5 1v4"/>
    </svg>
  )
}

function IconOdontologia({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-1.7 0-3 1.5-3 3.5 0 1.2.5 2.3 1.2 3C9 9.3 7 11 7 13.5 7 17 9 22 12 22s5-5 5-8.5c0-2.5-2-4.2-3.2-5 .7-.7 1.2-1.8 1.2-3C15 3.5 13.7 2 12 2z"/>
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

function PingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} />
    </span>
  )
}

function FarmaciaModal({ affiliateNumber, onClose }: { affiliateNumber: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 text-center w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(134,96,239,0.1)' }}
        >
          <IconFarmacias color="var(--purple)" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-400)' }}>
          N° de afiliado
        </p>
        <div
          className="text-3xl font-bold tracking-widest my-4"
          style={{
            fontFamily: 'monospace',
            background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {affiliateNumber}
        </div>
        <p className="text-xs mb-6" style={{ color: 'var(--gray-500)' }}>
          Mostrá este número en la farmacia para acceder al 50% de descuento.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', cursor: 'pointer' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

interface ServiceItem {
  id: string
  title: string
  subtitle: string
  liveLabel?: string
  liveColor?: string
  badge?: string
  badgeColor?: string
  badgeBg?: string
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal'
  buttonHref?: string
  iconBg: string
  iconColor: string
  Icon: React.ComponentType<{ color: string }>
}

export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)

  const services: ServiceItem[] = [
    {
      id: 'teleconsultas',
      title: 'DOC24',
      subtitle: 'Teleconsultas médicas',
      liveLabel: '24hs disponible',
      liveColor: '#16a34a',
      buttonLabel: 'Acceder',
      buttonAction: 'link',
      buttonHref: '#',
      iconBg: 'rgba(134,96,239,0.1)',
      iconColor: 'var(--purple)',
      Icon: IconDOC24,
    },
    {
      id: 'urgencias',
      title: 'Urgencias',
      subtitle: 'Asistencia 24/7',
      liveLabel: 'Inmediato',
      liveColor: '#dc2626',
      buttonLabel: 'Llamar',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      Icon: IconUrgencias,
    },
    {
      id: 'farmacias',
      title: 'Farmacias',
      subtitle: 'Descuentos en toda la red',
      badge: '50% off',
      badgeColor: '#16a34a',
      badgeBg: 'rgba(22,163,74,0.1)',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      iconBg: 'rgba(34,197,94,0.1)',
      iconColor: '#16a34a',
      Icon: IconFarmacias,
    },
    {
      id: 'odontologia',
      title: 'Odontología',
      subtitle: 'Guardias de urgencia',
      badge: 'Urgencias',
      badgeColor: '#0f766e',
      badgeBg: 'rgba(15,118,110,0.1)',
      buttonLabel: 'Info',
      buttonAction: 'link',
      buttonHref: '#',
      iconBg: 'rgba(20,184,166,0.1)',
      iconColor: '#14b8a6',
      Icon: IconOdontologia,
    },
  ]

  function handleAction(service: ServiceItem) {
    if (service.buttonAction === 'modal') {
      setFarmaciaModalOpen(true)
    } else if (service.buttonAction === 'tel' && service.buttonHref) {
      window.location.href = service.buttonHref
    } else if (service.buttonHref) {
      window.open(service.buttonHref, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--gray-100)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
            Tus servicios
          </p>
        </div>

        {/* Rows */}
        {services.map((service, i) => (
          <div key={service.id}>
            <div className="px-5 py-4 flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: service.iconBg }}
              >
                <service.Icon color={service.iconColor} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                    {service.title}
                  </p>
                  {service.liveLabel && (
                    <div className="flex items-center gap-1">
                      <PingDot color={service.liveColor!} />
                      <span className="text-xs font-medium" style={{ color: service.liveColor }}>{service.liveLabel}</span>
                    </div>
                  )}
                  {service.badge && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: service.badgeBg, color: service.badgeColor }}
                    >
                      {service.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>{service.subtitle}</p>
              </div>

              {/* Action */}
              <button
                onClick={() => handleAction(service)}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 active:scale-95"
                style={{ color: service.iconColor, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
              >
                <span>{service.buttonLabel}</span>
                <IconChevron />
              </button>
            </div>

            {i < services.length - 1 && (
              <div className="mx-5" style={{ height: '1px', background: 'var(--gray-100)' }} />
            )}
          </div>
        ))}
      </div>

      {farmaciaModalOpen && (
        <FarmaciaModal
          affiliateNumber={affiliate?.affiliate_number ?? '—'}
          onClose={() => setFarmaciaModalOpen(false)}
        />
      )}
    </>
  )
}
