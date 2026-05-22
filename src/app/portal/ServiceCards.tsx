'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'

interface ServiceCardsProps {
  affiliate: Affiliate | null
}

function IconDOC24() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14" />
      <rect x="2" y="7" width="13" height="10" rx="2" />
    </svg>
  )
}

function IconUrgencias() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10l4 4v7a1 1 0 0 1-1 1h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M8 10h4M10 8v4" />
    </svg>
  )
}

function IconFarmacias() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  )
}

function IconOdontologia() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1 .5 2 .5 3 0 2 .5 4 1.5 5.5.5.8 1 1.5 1.5 1.5s1-1 1.5-2.5c.3-1 .5-2 .5-3 0 1 .2 2 .5 3 .5 1.5 1 2.5 1.5 2.5s1-.7 1.5-1.5C18.5 17 19 15 19 13c0-1 .2-2 .5-3 .5-2-.5-4.5-2-6S13.5 3.5 12 5.5Z" />
    </svg>
  )
}

function FarmaciaModal({ affiliateNumber, onClose }: { affiliateNumber: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="glass-card p-8 text-center w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div
          className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}
        >
          <IconFarmacias />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
          N° de afiliado
        </p>
        <div
          className="text-2xl font-bold tracking-wider break-all my-4"
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
        <p className="text-sm mb-6" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
          Mostrá este número en la farmacia para el 50% de descuento.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 min-h-[44px] rounded-full text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
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
  badge: string
  badgeColor: string
  badgeBg: string
  badgeDot?: boolean
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal'
  buttonHref?: string
  accentColor: string
  accentBg: string
  glowColor: string
  Icon: React.ComponentType
}

export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)

  const services: ServiceItem[] = [
    {
      id: 'teleconsultas',
      title: 'DOC24',
      subtitle: 'Médico online las 24 horas',
      badge: '24hs · En vivo',
      badgeColor: '#16a34a',
      badgeBg: 'rgba(22,163,74,0.08)',
      badgeDot: true,
      buttonLabel: 'Acceder ahora',
      buttonAction: 'link',
      buttonHref: '#',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(134,96,239,0.15)',
      Icon: IconDOC24,
    },
    {
      id: 'urgencias',
      title: 'Urgencias',
      subtitle: 'Asistencia médica inmediata',
      badge: 'Disponible 24/7',
      badgeColor: '#dc2626',
      badgeBg: 'rgba(220,38,38,0.08)',
      badgeDot: true,
      buttonLabel: 'Llamar ahora',
      buttonAction: 'tel',
      buttonHref: 'tel:+541100000000',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(134,96,239,0.12)',
      Icon: IconUrgencias,
    },
    {
      id: 'farmacias',
      title: 'Farmacias',
      subtitle: 'Red de farmacias adheridas',
      badge: '50% descuento',
      badgeColor: '#059669',
      badgeBg: 'rgba(5,150,105,0.08)',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(16,185,129,0.12)',
      Icon: IconFarmacias,
    },
    {
      id: 'odontologia',
      title: 'Odontología',
      subtitle: 'Guardias y consultas urgentes',
      badge: 'Urgencias dentales',
      badgeColor: '#7c3aed',
      badgeBg: 'rgba(124,58,237,0.08)',
      buttonLabel: 'Más información',
      buttonAction: 'link',
      buttonHref: '#',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(139,92,246,0.12)',
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
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl flex items-center gap-4 p-4 sm:p-5 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
              style={{ background: service.glowColor }}
            />

            {/* Icon */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
              style={{
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                color: 'white',
                boxShadow: '0 4px 16px rgba(134,96,239,0.22)',
              }}
            >
              <service.Icon />
            </div>

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0 relative z-10">
              <p
                className="text-sm sm:text-base font-bold leading-tight"
                style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {service.title}
              </p>
              <p className="text-sm leading-snug mt-0.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
                {service.subtitle}
              </p>
            </div>

            {/* CTA pill badge */}
            <button
              onClick={() => handleAction(service)}
              className="shrink-0 relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: 'rgba(134,96,239,0.10)',
                border: '1px solid rgba(134,96,239,0.20)',
                color: 'var(--purple)',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(134,96,239,0.18)'
                e.currentTarget.style.borderColor = 'rgba(134,96,239,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(134,96,239,0.10)'
                e.currentTarget.style.borderColor = 'rgba(134,96,239,0.20)'
              }}
            >
              {service.buttonLabel}
            </button>
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
