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

interface ServiceItem {
  id: string
  title: string
  subtitle: string
  badge: string
  badgeColor: string
  badgeBg: string
  badgeDot?: boolean
  buttonLabel: string
  buttonAction: 'link' | 'tel' | 'modal' | 'info'
  buttonHref?: string
  accentColor: string
  accentBg: string
  glowColor: string
  Icon: React.ComponentType
  description: string
  descriptionExtra?: string
  bullets: string[]
  whatsapp?: string
}

/* ── Modal genérico de información ── */
function ServiceInfoModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,5,61,0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 flex items-center gap-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}
          >
            <service.Icon />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {service.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>
              {service.subtitle}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-dm-sans)' }}>
            {service.description}
          </p>
          {service.descriptionExtra && (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
              {service.descriptionExtra}
            </p>
          )}
          <ul className="flex flex-col gap-2.5">
            {service.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-sm mt-px shrink-0" style={{ color: 'var(--pink)' }}>✔</span>
                <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-dm-sans)' }}>
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-1 flex flex-col gap-2">
          {service.whatsapp && (
            <a
              href={service.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl text-sm font-semibold text-center transition-opacity active:scale-95 flex items-center justify-center gap-2"
              style={{ background: '#25D366', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Enviar WhatsApp
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal Urgencias (descripción + teléfonos) ── */
function UrgenciasModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
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
        {/* Header */}
        <div
          className="px-6 pt-7 pb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.22) 0%, rgba(139,0,0,0.12) 100%)', borderBottom: '1px solid rgba(220,38,38,0.18)' }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'rgba(220,38,38,0.18)', filter: 'blur(24px)' }} />
          <div className="flex items-center gap-4 relative">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(220,38,38,0.20)', border: '1px solid rgba(220,38,38,0.35)', color: '#f87171' }}
            >
              <IconUrgencias />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>Urgencias Médicas</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <p className="text-xs font-medium" style={{ color: 'rgba(248,113,113,0.80)', fontFamily: 'var(--font-dm-sans)' }}>Disponible 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="px-6 pt-5 pb-2 flex flex-col gap-3">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
            {service.description}
          </p>
          {service.descriptionExtra && (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-dm-sans)' }}>
              {service.descriptionExtra}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {service.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-xs mt-0.5 shrink-0" style={{ color: '#f87171' }}>✔</span>
                <span className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="h-px w-full mt-1" style={{ background: 'rgba(220,38,38,0.15)' }} />
        </div>

        {/* Teléfonos */}
        <div className="px-5 py-3 flex flex-col gap-3">
          <a
            href="tel:3414345400"
            className="group flex items-center justify-between px-5 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(185,28,28,0.12) 100%)', border: '1px solid rgba(220,38,38,0.28)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(248,113,113,0.65)', fontFamily: 'var(--font-dm-sans)' }}>Contacto principal</p>
              <p className="text-xl font-bold tracking-wide" style={{ color: '#fca5a5', fontFamily: 'monospace', letterSpacing: '0.04em' }}>341-434-5400</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(220,38,38,0.22)', border: '1px solid rgba(220,38,38,0.35)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={phoneIconPath} /></svg>
            </div>
          </a>
          <a
            href="tel:3415286900"
            className="flex items-center justify-between px-5 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>Contacto alternativo</p>
              <p className="text-xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>341-528-6900</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={phoneIconPath} /></svg>
            </div>
          </a>
        </div>

        <div className="px-5 pb-6 pt-2">
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

/* ── Modal Farmacias (descripción + credencial) ── */
function FarmaciaModal({ service, affiliateNumber, onClose }: { service: ServiceItem; affiliateNumber: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="glass-card p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid rgba(134,96,239,0.12)', paddingBottom: '1rem' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}
          >
            <IconFarmacias />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>Farmacias</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>Descuentos en Rosario y la región</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
          {service.description}
        </p>
        {service.descriptionExtra && (
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
            {service.descriptionExtra}
          </p>
        )}
        <ul className="flex flex-col gap-1.5 mb-5">
          {service.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--purple)' }}>✔</span>
              <span className="text-xs leading-snug" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>{bullet}</span>
            </li>
          ))}
        </ul>

        <div style={{ borderTop: '1px solid rgba(134,96,239,0.12)', paddingTop: '1rem' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-center" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
            N° de afiliado
          </p>
          <div
            className="text-2xl font-bold tracking-wider break-all my-3 text-center"
            style={{ fontFamily: 'monospace', background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            {affiliateNumber}
          </div>
          <p className="text-sm mb-4 text-center" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
            Mostrá este número en la farmacia y la receta para aprovechar hasta el 50% de descuento.
          </p>
        </div>

        <a
          href="/vademecum"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-full text-sm font-bold mb-3"
          style={{ background: 'rgba(134,96,239,0.10)', color: 'var(--purple)', border: '1px solid rgba(134,96,239,0.25)', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Ver medicamentos con cobertura
        </a>

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

/* ── Componente principal ── */
export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)
  const [urgenciasModalOpen, setUrgenciasModalOpen] = useState(false)
  const [infoService, setInfoService] = useState<ServiceItem | null>(null)

  const services: ServiceItem[] = [
    {
      id: 'teleconsultas',
      title: 'Teleconsultas Médicas 24/7',
      subtitle: 'Médico online desde tu celular',
      badge: '24hs · En vivo',
      badgeColor: '#16a34a',
      badgeBg: 'rgba(22,163,74,0.08)',
      badgeDot: true,
      buttonLabel: 'Iniciar consulta',
      buttonAction: 'link',
      buttonHref: 'https://doctorprevinca.videoconsultas.app/paciente/autogestion',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(134,96,239,0.15)',
      Icon: IconDOC24,
      description: 'Consultá con médicos clínicos y pediatras estés donde estés, sin traslados ni largas esperas. Con Nexo accedés a atención médica online las 24 horas, directamente desde tu celular.',
      descriptionExtra: 'Porque sentirte bien también es poder resolver una consulta médica de forma simple y segura, adaptada a tu ritmo de vida.',
      bullets: [
        'Atención médica online 24/7',
        'Desde cualquier lugar',
        'Ideal para consultas cotidianas',
        'Atención rápida y práctica',
        'Más comodidad y bienestar para tu día a día',
      ],
    },
    {
      id: 'urgencias',
      title: 'Urgencias 24/7',
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
      description: 'Porque los imprevistos pasan. Con Previnca Nexo tenés asistencia inmediata ante urgencias, las 24 horas, todos los días, para que puedas sentirte acompañado cuando más lo necesitás.',
      descriptionExtra: 'Todo de forma simple, rápida y pensada para tu estilo de vida. Porque el bienestar también es tener tranquilidad y respaldo en cualquier momento.',
      bullets: [
        'Atención rápida 24/7',
        'Cobertura en tu zona',
        'Acceso simple desde tu credencial digital',
        'Más tranquilidad para tu día a día',
        'Respaldo cuando lo necesitás',
      ],
    },
    {
      id: 'farmacias',
      title: 'Descuentos en Rosario y la región',
      subtitle: 'Farmacias en Rosario y la región',
      badge: '50% descuento',
      badgeColor: '#059669',
      badgeBg: 'rgba(5,150,105,0.08)',
      buttonLabel: 'Ver credencial',
      buttonAction: 'modal',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(16,185,129,0.12)',
      Icon: IconFarmacias,
      description: 'Cuidar tu salud también puede ser más accesible. Con Previnca Nexo accedés a descuentos exclusivos en medicamentos presentando receta en farmacias adheridas en Rosario y la región.',
      descriptionExtra: 'Porque el bienestar también es ahorrar en lo que necesitás todos los días, de forma simple y sin complicaciones.',
      bullets: [
        'Hasta 50% OFF en farmacias adheridas',
        'Farmacias en Rosario y la región',
        'Más ahorro en medicamentos esenciales',
        'Todo al alcance desde tu credencial digital',
      ],
    },
    {
      id: 'odontologia',
      title: 'Guardia Odontológica',
      subtitle: 'Guardias y consultas urgentes',
      badge: 'Urgencias dentales',
      badgeColor: '#7c3aed',
      badgeBg: 'rgba(124,58,237,0.08)',
      buttonLabel: 'Ver información',
      buttonAction: 'info',
      accentColor: 'white',
      accentBg: 'rgba(134,96,239,0.10)',
      glowColor: 'rgba(139,92,246,0.12)',
      Icon: IconOdontologia,
      description: 'Enviá un mensaje al WhatsApp del prestador al 341 3077912 para informar que vas a concurrir a la atención. Luego, podés acercarte a España 729, Rosario.',
      descriptionExtra: 'Horarios de atención: lunes a viernes de 8 a 20 hs.',
      bullets: [
        'Atención odontológica de urgencia',
        'Acceso digital simple',
        'Cobertura práctica y accesible',
        'Más tranquilidad para tu día a día',
      ],
      whatsapp: 'https://wa.me/5493413077912?text=Hola%2C%20voy%20a%20concurrir%20a%20la%20guardia%20odontol%C3%B3gica',
    },
  ]

  function handleAction(service: ServiceItem) {
    if (service.buttonAction === 'info') {
      setInfoService(service)
    } else if (service.buttonAction === 'modal') {
      if (service.id === 'urgencias') setUrgenciasModalOpen(true)
      else setFarmaciaModalOpen(true)
    } else if (service.buttonAction === 'tel' && service.buttonHref) {
      window.location.href = service.buttonHref
    } else if (service.buttonHref) {
      window.open(service.buttonHref, '_blank', 'noopener,noreferrer')
    }
  }

  const urgenciasService = services.find(s => s.id === 'urgencias')!
  const farmaciaService = services.find(s => s.id === 'farmacias')!

  return (
    <>
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl flex items-center gap-4 p-4 sm:p-5 relative overflow-hidden"
          >
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
              style={{ background: service.glowColor }}
            />

            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
              style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}
            >
              <service.Icon />
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm sm:text-base font-bold leading-tight" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                {service.title}
              </p>
              <p className="text-sm leading-snug mt-0.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
                {service.subtitle}
              </p>
            </div>

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
        <UrgenciasModal service={urgenciasService} onClose={() => setUrgenciasModalOpen(false)} />
      )}
      {farmaciaModalOpen && (
        <FarmaciaModal
          service={farmaciaService}
          affiliateNumber={affiliate?.affiliate_number ?? '—'}
          onClose={() => setFarmaciaModalOpen(false)}
        />
      )}
      {infoService && (
        <ServiceInfoModal service={infoService} onClose={() => setInfoService(null)} />
      )}
    </>
  )
}
