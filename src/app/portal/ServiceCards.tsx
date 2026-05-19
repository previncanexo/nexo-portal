'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

function IconDOC24() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function IconUrgencias() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 4.27l-4.12 2.6A2 2 0 0 0 2.5 8.6v6.8a2 2 0 0 0 .88 1.66l7.5 5a2 2 0 0 0 2.24 0l7.5-5a2 2 0 0 0 .88-1.66V8.6a2 2 0 0 0-.88-1.73L16.5 4.27a2 2 0 0 0-2.24 0z"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function IconFarmacias() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1h3a1.5 1.5 0 0 1 1.5 1.5V5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2.5A1.5 1.5 0 0 1 10.5 1z"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
      <path d="M10.5 1v4M13.5 1v4"/>
    </svg>
  )
}

function IconOdontologia() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-1.7 0-3 1.5-3 3.5 0 1.2.5 2.3 1.2 3C9 9.3 7 11 7 13.5 7 17 9 22 12 22s5-5 5-8.5c0-2.5-2-4.2-3.2-5 .7-.7 1.2-1.8 1.2-3C15 3.5 13.7 2 12 2z"/>
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
        <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>Disponible 24hs</span>
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
        <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Respuesta inmediata</span>
      </div>
    )
  }
  if (serviceId === 'farmacias') {
    return (
      <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>50% de descuento</span>
    )
  }
  return (
    <span className="text-xs font-semibold" style={{ color: '#0f766e' }}>Urgencias disponibles</span>
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
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--gray-500)' }}
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
        <p className="text-xs mb-6" style={{ color: 'var(--gray-600)' }}>
          Mostrá este número en la farmacia para acceder al 50% de descuento.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
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
  description: string
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal'
  buttonHref?: string
  icon: React.ReactNode
  colorFrom: string
  colorTo: string
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
      icon: <IconDOC24 />,
      colorFrom: 'var(--purple)',
      colorTo: 'var(--pink)',
    },
    {
      id: 'urgencias',
      title: 'Urgencias 24/7',
      description: 'Asistencia médica de emergencia disponible las 24 horas, los 7 días.',
      buttonLabel: 'Llamar ahora',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      icon: <IconUrgencias />,
      colorFrom: '#EF4444',
      colorTo: '#F97316',
    },
    {
      id: 'farmacias',
      title: 'Descuentos en Farmacias',
      description: 'Accedé a descuentos exclusivos en farmacias adheridas de todo el país.',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      icon: <IconFarmacias />,
      colorFrom: '#22C55E',
      colorTo: '#16A34A',
    },
    {
      id: 'odontologia',
      title: 'Guardia Odontológica',
      description: 'Atención odontológica de urgencia para aliviar tu dolor cuando más lo necesitás.',
      buttonLabel: 'Más información',
      buttonAction: 'link',
      buttonHref: '#',
      icon: <IconOdontologia />,
      colorFrom: '#14B8A6',
      colorTo: 'var(--purple)',
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
          style={{ color: 'var(--gray-500)' }}
        >
          Tus servicios
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="glass-card p-5 flex flex-col gap-4"
            >
              {/* Ícono con gradiente */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${service.colorFrom} 0%, ${service.colorTo} 100%)` }}
              >
                {service.icon}
              </div>

              {/* Status badge */}
              <StatusBadge serviceId={service.id} />

              {/* Título y descripción */}
              <div>
                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                  {service.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--gray-600)' }}>
                  {service.description}
                </p>
              </div>

              {/* Botón */}
              <button
                onClick={() => handleCardAction(service)}
                className="w-full py-2.5 px-3 rounded-full text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 text-center mt-auto"
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
