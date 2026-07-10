'use client'

import { useState } from 'react'
import type { Affiliate } from '@/lib/types'
import { registerPsicologiaClick, registerSeguroHogarSolicitud } from './actions'

const PSICOLOGIA_URL = process.env.NEXT_PUBLIC_PSICOLOGIA_URL

// Equipo de psicología (fuente: doc consolidada del servicio, julio 2026).
// `agendaUrl` queda vacío hasta que DOC24 confirme si expone un link por profesional.
// Mientras tanto todos caen a PSICOLOGIA_URL y la UI lo aclara: se elige el profesional
// dentro de DOC24. Cuando existan los links, sólo se completa este campo.
const PSICOLOGOS: { id: string; nombre: string; iniciales: string; dias: string; franja: string; agendaUrl?: string }[] = [
  { id: 'reimers', nombre: 'Lic. Lorena Reimers', iniciales: 'LR', dias: 'Lunes y Miércoles', franja: '13:30 – 17:30' },
  { id: 'blanco', nombre: 'Lic. Laura Blanco', iniciales: 'LB', dias: 'Martes', franja: '08:30 – 11:00' },
  { id: 'aragues', nombre: 'Lic. María Camila Aragues', iniciales: 'MA', dias: 'Miércoles', franja: '10:00 – 11:30' },
  { id: 'medina', nombre: 'Lic. Rocío Medina', iniciales: 'RM', dias: 'Jueves', franja: '09:00 – 11:30' },
  { id: 'estigarribia', nombre: 'Lic. Censo Estigarribia', iniciales: 'CE', dias: 'Viernes', franja: '13:00 – 17:00' },
]

const SEGURO_HOGAR_URL = process.env.NEXT_PUBLIC_SEGURO_HOGAR_URL

const SEGURO_PLANES = [
  {
    id: 'hasta_1er_piso' as const,
    badge: 'Hasta 1er piso',
    alcance: 'Casas, PB y 1er piso · Solo en Rosario',
    precio: '$19.000',
  },
  {
    id: 'segundo_piso_plus' as const,
    badge: '2do piso +',
    alcance: '2do piso en adelante · Dentro y fuera de Rosario',
    precio: '$22.000',
  },
]

const SEGURO_COBERTURAS_PRINCIPALES = ['Incendio Edificio', 'Responsabilidad Civil', 'Equipos Electrónicos']

// Detalle desplegable: mismas sumas aseguradas para ambos planes; sólo cambia la cuota.
const SEGURO_COBERTURA_COMPLETA = [
  { nombre: 'Incendio Edificio', monto: '$80.000.000', detalle: 'Reconstrucción y/o reparación y/o reposición · Incendio Primer Riesgo Absoluto $8.000.000 · Huracán, Vendaval, Ciclón y/o Tornado — Sublímite 100%' },
  { nombre: 'Incendio Contenido', monto: '$3.200.000', detalle: 'Huracán, Vendaval, Ciclón y/o Tornado — Sublímite 100% · Daños a Equipos Electrónicos por Rayo — Sublímite 100%' },
  { nombre: 'Cristales, vidrios y espejos', monto: '$700.000', detalle: '' },
  { nombre: 'Resp. Civil Hechos Privados', monto: '$4.000.000', detalle: '' },
  { nombre: 'Resp. Civil Linderos', monto: '$6.000.000', detalle: '' },
  { nombre: 'Seg. Técnico — Eq. Electrónicos', monto: '$800.000', detalle: '' },
  { nombre: 'Seg. Técnico — Línea Blanca', monto: '$900.000', detalle: '' },
]

const SEGURO_LEGAL = 'Cobertura sujeta a los términos y condiciones de la póliza correspondiente a la contratación, brindada por la compañía SAN CRISTÓBAL SEGUROS, CUIT 34-50004533-9, inscripta en la Superintendencia de Seguros de la Nación (SSN) mediante Nro. 0192. PREVINCA SERVICIOS SOCIALES S.A.C.I.F.I.Y.A., CUIT 30-54026445-3, interviene como Agente Institorio de la aseguradora inscripto en el Registro de Agentes Institorios de la SSN bajo el N° 233.'

// Tema de acento para las cards "aparte" (Psicología y Seguro): teal, distinto del violeta de marca.
interface CardTheme {
  gradient: string
  solid: string
  soft: string
  border: string
  softHover: string
  borderHover: string
}
const TEAL: CardTheme = {
  gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
  solid: '#0d9488',
  soft: 'rgba(13,148,136,0.10)',
  border: 'rgba(13,148,136,0.20)',
  softHover: 'rgba(13,148,136,0.18)',
  borderHover: 'rgba(13,148,136,0.35)',
}

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

function IconPsicologia() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a4.5 4.5 0 0 0-4.4 5.5A4 4 0 0 0 4 13a4 4 0 0 0 3 3.9V19a2 2 0 0 0 4 0V4.5A2.5 2.5 0 0 0 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5V19a2 2 0 0 0 4 0v-2.1A4 4 0 0 0 20 13a4 4 0 0 0-1.1-5.5A4.5 4.5 0 0 0 14.5 2Z" />
    </svg>
  )
}

function IconHogar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
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
  /** Tema de color de la card (ícono + botón). Si falta, usa el violeta de marca. */
  theme?: CardTheme
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
              <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>Emergencias médicas</p>
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
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>Descuentos en Farmacias</p>
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

        <a
          href="https://drive.google.com/file/d/1qCXH9unJU6DVAwo5KUUTy2NFQJIit_UZ/view"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 min-h-[44px] rounded-full text-sm font-bold mb-3"
          style={{ background: 'rgba(134,96,239,0.10)', color: 'var(--purple)', border: '1px solid rgba(134,96,239,0.25)', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Ver farmacias adheridas
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

/* ── Modal Psicología On Demand ── */
function PsicologiaModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
  const acento = service.theme?.solid ?? 'var(--purple)'
  const gradiente = service.theme?.gradient ?? 'linear-gradient(135deg, var(--purple), var(--pink))'
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,5,61,0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: gradiente, color: 'white' }}>
            <service.Icon />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{service.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>{service.subtitle}</p>
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-dm-sans)' }}>{service.description}</p>

          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>
              Equipo profesional · videoconsulta de 30 min
            </p>
            {PSICOLOGOS.map((p) => (
              <div key={p.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <div
                  className="w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0"
                  style={{ background: service.theme?.soft ?? 'rgba(134,96,239,0.18)', border: `1px dashed ${service.theme?.borderHover ?? 'rgba(255,255,255,0.25)'}`, color: acento }}
                  aria-label={`Foto de ${p.nombre} pendiente`}
                >
                  <span className="text-xs font-bold leading-none" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.iniciales}</span>
                  <span className="text-[8px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>foto</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white leading-tight truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.nombre}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-dm-sans)' }}>{p.dias} · {p.franja}</p>
                </div>
                <a
                  href={p.agendaUrl ?? PSICOLOGIA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { void registerPsicologiaClick() }}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-center active:scale-95"
                  style={{ background: gradiente, color: 'white', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Reservar
                </a>
              </div>
            ))}
          </div>

          {/* Aviso */}
          <p className="text-xs leading-relaxed rounded-xl px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-dm-sans)' }}>
            Servicio adicional. Se cobra aparte de tu cobertura Previnca Nexo. El turno se reserva
            en DOC24, donde elegís al profesional y la franja disponible.
          </p>
        </div>

        <div className="px-5 pb-6 pt-1">
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

/* ── Modal Seguro de Hogar (dos planes + cobertura completa + legal) ── */
function SeguroHogarModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
  const [coberturaAbierta, setCoberturaAbierta] = useState(false)
  const acento = service.theme?.solid ?? 'var(--purple)'
  const gradiente = service.theme?.gradient ?? 'linear-gradient(135deg, var(--purple), var(--pink))'
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,5,61,0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: gradiente, color: 'white' }}>
            <service.Icon />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{service.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>{service.subtitle}</p>
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
          {SEGURO_PLANES.map((p) => (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>HOGAR PROTEGIDO</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: service.theme?.soft ?? 'rgba(134,96,239,0.18)', color: acento }}>{p.badge}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>{p.alcance}</p>
              <p className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.precio}<span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>/mes</span></p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>6 cuotas sin interés</p>
              <ul className="flex flex-col gap-1.5 mb-3">
                {SEGURO_COBERTURAS_PRINCIPALES.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-dm-sans)' }}>
                    <span style={{ color: acento }}>✔</span>{c}
                  </li>
                ))}
              </ul>
              <a
                href={SEGURO_HOGAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void registerSeguroHogarSolicitud(p.id) }}
                className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center active:scale-95"
                style={{ background: gradiente, color: 'white', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}
              >
                Contratar
              </a>
            </div>
          ))}

          <button
            onClick={() => setCoberturaAbierta((v) => !v)}
            className="text-xs font-semibold text-left"
            style={{ color: acento, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            {coberturaAbierta ? 'Ocultar cobertura completa ▲' : 'Ver cobertura completa ▼'}
          </button>
          {coberturaAbierta && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>
                Sumas aseguradas vigentes — 2026 · iguales para ambos planes
              </p>
              {SEGURO_COBERTURA_COMPLETA.map((c, i) => (
                <div key={i} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{c.nombre}</span>
                    <span className="text-xs font-bold" style={{ color: acento, fontFamily: 'var(--font-dm-sans)' }}>{c.monto}</span>
                  </div>
                  {c.detalle && <p className="text-[11px] mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>{c.detalle}</p>}
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>{SEGURO_LEGAL}</p>
        </div>

        <div className="px-5 pb-6 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Componente principal ── */
export default function ServiceCards({ affiliate }: ServiceCardsProps) {
  const [farmaciaModalOpen, setFarmaciaModalOpen] = useState(false)
  const [urgenciasModalOpen, setUrgenciasModalOpen] = useState(false)
  const [psicologiaModalOpen, setPsicologiaModalOpen] = useState(false)
  const [seguroHogarModalOpen, setSeguroHogarModalOpen] = useState(false)
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
      title: 'Emergencias médicas',
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
      title: 'Descuentos en Farmacias',
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
      description: 'Descuento en farmacias: presentando tu receta con el número de farmacia que figura en tu credencial digital, podés acceder al 50% OFF en más de 6000 medicamentos seleccionados.',
      descriptionExtra: '',
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
    ...(PSICOLOGIA_URL
      ? [{
          id: 'psicologia',
          title: 'Psicología On Demand',
          subtitle: 'Sesiones con profesionales, a tu ritmo',
          badge: 'Pago aparte',
          badgeColor: '#0d9488',
          badgeBg: 'rgba(13,148,136,0.10)',
          buttonLabel: 'Ver y reservar',
          buttonAction: 'modal' as const,
          accentColor: 'white',
          accentBg: 'rgba(13,148,136,0.10)',
          glowColor: 'rgba(13,148,136,0.16)',
          theme: TEAL,
          Icon: IconPsicologia,
          description: 'Accedé a sesiones de psicología con profesionales, de forma simple y online. Es un servicio adicional, independiente de tu cobertura Previnca Nexo, que se abona por separado.',
          bullets: [
            'Sesiones con profesionales',
            'Reservás tu turno online',
            'Servicio adicional, se cobra aparte',
          ],
        }]
      : []),
    ...(SEGURO_HOGAR_URL
      ? [{
          id: 'seguro-hogar',
          title: 'Seguros del Hogar On Demand',
          subtitle: 'Cobertura para tu hogar, se contrata aparte',
          badge: 'Pago aparte',
          badgeColor: '#0d9488',
          badgeBg: 'rgba(13,148,136,0.10)',
          buttonLabel: 'Ver planes',
          buttonAction: 'modal' as const,
          accentColor: 'white',
          accentBg: 'rgba(13,148,136,0.10)',
          glowColor: 'rgba(13,148,136,0.16)',
          theme: TEAL,
          Icon: IconHogar,
          description: 'Asegurá tu hogar con planes pensados para Rosario y la región. Es un producto adicional, independiente de tu cobertura Previnca Nexo, que se contrata y abona por separado.',
          bullets: [
            'Incendio, Responsabilidad Civil y más',
            'Producto adicional, se contrata aparte',
          ],
        }]
      : []),
  ]

  function handleAction(service: ServiceItem) {
    if (service.buttonAction === 'info') {
      setInfoService(service)
    } else if (service.buttonAction === 'modal') {
      if (service.id === 'seguro-hogar') setSeguroHogarModalOpen(true)
      else if (service.id === 'psicologia') setPsicologiaModalOpen(true)
      else if (service.id === 'urgencias') setUrgenciasModalOpen(true)
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
              style={{ background: service.theme?.gradient ?? 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}
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
                background: service.theme?.soft ?? 'rgba(134,96,239,0.10)',
                border: `1px solid ${service.theme?.border ?? 'rgba(134,96,239,0.20)'}`,
                color: service.theme?.solid ?? 'var(--purple)',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = service.theme?.softHover ?? 'rgba(134,96,239,0.18)'
                e.currentTarget.style.borderColor = service.theme?.borderHover ?? 'rgba(134,96,239,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = service.theme?.soft ?? 'rgba(134,96,239,0.10)'
                e.currentTarget.style.borderColor = service.theme?.border ?? 'rgba(134,96,239,0.20)'
              }}
            >
              {service.buttonLabel}
            </button>
          </div>
        ))}
      </div>

      {seguroHogarModalOpen && (
        <SeguroHogarModal
          service={services.find((s) => s.id === 'seguro-hogar')!}
          onClose={() => setSeguroHogarModalOpen(false)}
        />
      )}
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
      {psicologiaModalOpen && (
        <PsicologiaModal
          service={services.find((s) => s.id === 'psicologia')!}
          onClose={() => setPsicologiaModalOpen(false)}
        />
      )}
    </>
  )
}
