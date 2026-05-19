'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

function IconVideoCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14" />
      <rect x="2" y="7" width="13" height="10" rx="2" />
      <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconAmbulance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10l4 4v7a1 1 0 0 1-1 1h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M8 10h4M10 8v4" />
      <path d="M10 17h5" />
    </svg>
  )
}

function IconPill() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  )
}

function IconTooth() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1 .5 2 .5 3 0 2 .5 4 1.5 5.5.5.8 1 1.5 1.5 1.5s1-1 1.5-2.5c.3-1 .5-2 .5-3 0 1 .2 2 .5 3 .5 1.5 1 2.5 1.5 2.5s1-.7 1.5-1.5C18.5 17 19 15 19 13c0-1 .2-2 .5-3 .5-2-.5-4.5-2-6S13.5 3.5 12 5.5Z" />
    </svg>
  )
}

function StatusBadge({ serviceId }: { serviceId: string }) {
  if (serviceId === 'teleconsultas') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#4ade80' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#4ade80' }} />
        </span>
        <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>Disponible 24hs</span>
      </div>
    )
  }
  if (serviceId === 'urgencias') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#EF4444' }} />
        </span>
        <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Respuesta inmediata</span>
      </div>
    )
  }
  if (serviceId === 'farmacias') {
    return (
      <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>50% de descuento</span>
    )
  }
  return (
    <span className="text-xs font-semibold" style={{ color: '#14B8A6' }}>Urgencias disponibles</span>
  )
}

function FarmaciaModal({
  affiliateNumber,
  onClose,
}: {
  affiliateNumber: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 text-center max-w-xs w-full"
        style={{ border: '1px solid rgba(255,255,255,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Tu credencial de descuento
        </p>
        <div
          className="text-4xl font-bold tracking-widest my-4"
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
        <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Mostrá este número en la farmacia para acceder al 50% de descuento.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{
            background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

const SERVICE_COLORS: Record<string, string> = {
  teleconsultas: '#3B82F6',
  urgencias: '#EF4444',
  farmacias: '#22C55E',
  odontologia: '#14B8A6',
}

interface ServiceCard {
  id: string
  title: string
  description: string
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal'
  buttonHref?: string
  icon: React.ReactNode
}

export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)

  const services: ServiceCard[] = [
    {
      id: 'teleconsultas',
      title: 'Teleconsultas DOC24',
      description: 'Consultá con médicos desde tu celular, sin esperas ni traslados.',
      buttonLabel: 'Usar servicio',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconVideoCamera />,
    },
    {
      id: 'urgencias',
      title: 'Urgencias 24/7',
      description: 'Asistencia médica de emergencia disponible las 24 horas, los 7 días.',
      buttonLabel: 'Llamar ahora',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      icon: <IconAmbulance />,
    },
    {
      id: 'farmacias',
      title: 'Descuentos en Farmacias',
      description: 'Accedé a descuentos exclusivos en farmacias adheridas de todo el país.',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      icon: <IconPill />,
    },
    {
      id: 'odontologia',
      title: 'Guardia Odontológica',
      description: 'Atención odontológica de urgencia para aliviar tu dolor cuando más lo necesitás.',
      buttonLabel: 'Más información',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconTooth />,
    },
  ]

  function handleCardAction(service: ServiceCard) {
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
        <h3
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Tus servicios
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {services.map((service) => {
            const accentColor = SERVICE_COLORS[service.id]
            return (
              <div
                key={service.id}
                className="glass-card flex flex-col overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {/* Top color stripe */}
                <div className="h-1 w-full shrink-0" style={{ background: accentColor }} />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: `${accentColor}26` }}
                  >
                    <span style={{ color: accentColor }}>{service.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-1">
                      <StatusBadge serviceId={service.id} />
                    </div>
                    <h4
                      className="text-sm font-semibold text-white leading-tight mb-1"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {service.title}
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {service.description}
                    </p>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleCardAction(service)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 text-center"
                    style={{
                      background: accentColor,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {service.buttonLabel}
                  </button>
                </div>
              </div>
            )
          })}
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
