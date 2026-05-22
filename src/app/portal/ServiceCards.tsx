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

const phoneIconPath = "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"

function UrgenciasModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,5,61,0.82)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente rojo */}
        <div
          className="px-6 pt-7 pb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(139,0,0,0.12) 100%)', borderBottom: '1px solid rgba(220,38,38,0.18)' }}
        >
          {/* Glow de fondo */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'rgba(220,38,38,0.18)', filter: 'blur(24px)' }} />

          <div className="flex items-center gap-4 relative">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(220,38,38,0.20)', border: '1px solid rgba(220,38,38,0.35)', color: '#f87171' }}
            >
              <IconUrgencias />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Urgencias Médicas
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <p className="text-xs font-medium" style={{ color: 'rgba(248,113,113,0.80)', fontFamily: 'var(--font-dm-sans)' }}>
                  Disponible 24/7
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Números */}
        <div className="px-5 py-5 flex flex-col gap-3">
          <a
            href="tel:3414345400"
            className="group flex items-center justify-between px-5 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(185,28,28,0.12) 100%)', border: '1px solid rgba(220,38,38,0.28)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(248,113,113,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
                Contacto principal
              </p>
              <p className="text-xl font-bold tracking-wide" style={{ color: '#fca5a5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                341-434-5400
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(220,38,38,0.22)', border: '1px solid rgba(220,38,38,0.35)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={phoneIconPath}/>
              </svg>
            </div>
          </a>

          <a
            href="tel:3415286900"
            className="flex items-center justify-between px-5 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>
                Contacto alternativo
              </p>
              <p className="text-xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                341-528-6900
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={phoneIconPath}/>
              </svg>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-80 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
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
  const [urgenciasModalOpen, setUrgenciasModalOpen] = useState(false)

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
      title: 'Urgencias Médicas',
      subtitle: 'Asistencia médica inmediata',
      badge: 'Disponible 24/7',
      badgeColor: '#dc2626',
      badgeBg: 'rgba(220,38,38,0.08)',
      badgeDot: true,
      buttonLabel: 'Ver contactos',
      buttonAction: 'modal',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(220,38,38,0.12)',
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
      if (service.id === 'urgencias') setUrgenciasModalOpen(true)
      else setFarmaciaModalOpen(true)
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

      {urgenciasModalOpen && (
        <UrgenciasModal onClose={() => setUrgenciasModalOpen(false)} />
      )}
      {farmaciaModalOpen && (
        <FarmaciaModal
          affiliateNumber={affiliate?.affiliate_number ?? '—'}
          onClose={() => setFarmaciaModalOpen(false)}
        />
      )}
    </>
  )
}
