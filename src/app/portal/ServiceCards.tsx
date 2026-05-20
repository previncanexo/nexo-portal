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
          style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)' }}
        >
          <IconFarmacias />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gray-600)' }}>
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
        <p className="text-sm mb-6" style={{ color: 'var(--gray-500)' }}>
          Mostrá este número en la farmacia para el 50% de descuento.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 min-h-[44px] rounded-full text-sm font-semibold text-white"
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
      accentColor: 'var(--purple)',
      accentBg: 'rgba(134,96,239,0.1)',
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
      accentColor: '#ef4444',
      accentBg: 'rgba(239,68,68,0.1)',
      glowColor: 'rgba(239,68,68,0.12)',
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
      accentColor: '#10b981',
      accentBg: 'rgba(16,185,129,0.1)',
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
      accentColor: '#8b5cf6',
      accentBg: 'rgba(139,92,246,0.1)',
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
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-card p-4 flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Subtle glow blob top-right */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
              style={{ background: service.glowColor }}
            />

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
              style={{ background: service.accentBg, color: service.accentColor }}
            >
              <service.Icon />
            </div>

            {/* Title + subtitle */}
            <div className="relative z-10">
              <p
                className="text-base font-bold leading-tight"
                style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {service.title}
              </p>
              <p className="text-sm leading-snug mt-0.5" style={{ color: 'var(--gray-500)' }}>
                {service.subtitle}
              </p>
            </div>

            {/* Badge */}
            <div
              className="self-start flex items-center gap-1.5 px-2 py-1 rounded-full relative z-10"
              style={{ background: service.badgeBg }}
            >
              {service.badgeDot && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: service.badgeColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: service.badgeColor }}
                  />
                </span>
              )}
              <span className="text-xs font-semibold leading-none" style={{ color: service.badgeColor }}>
                {service.badge}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* CTA */}
            <button
              onClick={() => handleAction(service)}
              className="w-full py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-white active:scale-95 transition-transform relative z-10"
              style={{
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
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
