'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

function IconDOC24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function IconUrgencias() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 4.27l-4.12 2.6A2 2 0 0 0 2.5 8.6v6.8a2 2 0 0 0 .88 1.66l7.5 5a2 2 0 0 0 2.24 0l7.5-5a2 2 0 0 0 .88-1.66V8.6a2 2 0 0 0-.88-1.73L16.5 4.27a2 2 0 0 0-2.24 0z"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function IconFarmacias() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1h3a1.5 1.5 0 0 1 1.5 1.5V5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2.5A1.5 1.5 0 0 1 10.5 1z"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
      <path d="M10.5 1v4M13.5 1v4"/>
    </svg>
  )
}

function IconOdontologia() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-1.7 0-3 1.5-3 3.5 0 1.2.5 2.3 1.2 3C9 9.3 7 11 7 13.5 7 17 9 22 12 22s5-5 5-8.5c0-2.5-2-4.2-3.2-5 .7-.7 1.2-1.8 1.2-3C15 3.5 13.7 2 12 2z"/>
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

function ServiceBadge({ serviceId }: { serviceId: string }) {
  if (serviceId === 'teleconsultas') {
    return (
      <div className="flex items-center gap-1.5">
        <PingDot color="#4ade80" />
        <span className="text-xs font-medium" style={{ color: '#16a34a' }}>24hs disponible</span>
      </div>
    )
  }
  if (serviceId === 'urgencias') {
    return (
      <div className="flex items-center gap-1.5">
        <PingDot color="#f87171" />
        <span className="text-xs font-medium" style={{ color: '#dc2626' }}>Respuesta inmediata</span>
      </div>
    )
  }
  if (serviceId === 'farmacias') {
    return (
      <span
        className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
      >
        50% descuento
      </span>
    )
  }
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(15,118,110,0.1)', color: '#0f766e' }}
    >
      Urgencias
    </span>
  )
}

function FarmaciaModal({ affiliateNumber, onClose }: { affiliateNumber: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 text-center w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--gray-500)' }}>
          Credencial de descuento
        </p>
        <div
          className="text-4xl font-bold tracking-widest my-5"
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
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal'
  buttonHref?: string
  icon: React.ReactNode
  colorFrom: string
  colorTo: string
}

export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)

  const services: ServiceItem[] = [
    {
      id: 'teleconsultas',
      title: 'DOC24',
      subtitle: 'Teleconsultas médicas',
      buttonLabel: 'Acceder',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconDOC24 />,
      colorFrom: 'var(--purple)',
      colorTo: 'var(--pink)',
    },
    {
      id: 'urgencias',
      title: 'Urgencias',
      subtitle: 'Asistencia 24/7',
      buttonLabel: 'Llamar',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      icon: <IconUrgencias />,
      colorFrom: '#EF4444',
      colorTo: '#F97316',
    },
    {
      id: 'farmacias',
      title: 'Farmacias',
      subtitle: 'Descuentos adheridos',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      icon: <IconFarmacias />,
      colorFrom: '#22C55E',
      colorTo: '#16A34A',
    },
    {
      id: 'odontologia',
      title: 'Odontología',
      subtitle: 'Guardias de urgencia',
      buttonLabel: 'Info',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconOdontologia />,
      colorFrom: '#14B8A6',
      colorTo: 'var(--purple)',
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
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--gray-500)' }}
        >
          Tus servicios
        </p>

        <div className="flex flex-col gap-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="glass-card px-4 py-3.5 flex items-center gap-4"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${service.colorFrom} 0%, ${service.colorTo} 100%)` }}
              >
                {service.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                  {service.title}
                </p>
                <div className="mt-0.5">
                  <ServiceBadge serviceId={service.id} />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleAction(service)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-85 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${service.colorFrom} 0%, ${service.colorTo} 100%)`,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {service.buttonLabel}
              </button>
            </div>
          ))}
        </div>
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
