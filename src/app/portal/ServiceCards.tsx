'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

// Icons as inline SVG components
function IconMonitor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconCross() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20" />
    </svg>
  )
}

function IconPill() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  )
}

function IconTooth() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1 .5 2 .5 3 0 2 .5 4 1.5 5.5.5.8 1 1.5 1.5 1.5s1-1 1.5-2.5c.3-1 .5-2 .5-3 0 .3 0 0 0 0 0 1 .2 2 .5 3 .5 1.5 1 2.5 1.5 2.5s1-.7 1.5-1.5C18.5 17 19 15 19 13c0-1 .2-2 .5-3 .5-2-.5-4.5-2-6S13.5 3.5 12 5.5Z" />
    </svg>
  )
}

// Modal for farmacia credential
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

interface ServiceCard {
  id: string
  title: string
  subtitle: string
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
      subtitle: 'Siempre activo',
      description: 'Consultá con médicos desde tu celular, sin esperas ni traslados.',
      buttonLabel: 'Usar servicio',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconMonitor />,
    },
    {
      id: 'urgencias',
      title: 'Urgencias 24/7',
      subtitle: 'Respuesta rápida',
      description: 'Asistencia médica de emergencia disponible las 24 horas, los 7 días.',
      buttonLabel: 'Llamar ahora',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      icon: <IconCross />,
    },
    {
      id: 'farmacias',
      title: 'Descuentos en Farmacias',
      subtitle: '50% de ahorro',
      description: 'Accedé a descuentos exclusivos en farmacias adheridas de todo el país.',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      icon: <IconPill />,
    },
    {
      id: 'odontologia',
      title: 'Guardia Odontológica',
      subtitle: 'Rápido alivio',
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
          {services.map((service) => (
            <div
              key={service.id}
              className="glass-card p-4 flex flex-col gap-3"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                }}
              >
                {service.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {service.subtitle}
                </p>
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
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-80 active:scale-95 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(134,96,239,0.4) 0%, rgba(238,92,208,0.4) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
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
