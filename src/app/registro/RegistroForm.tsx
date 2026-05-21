'use client'

import { useState } from 'react'
import Image from 'next/image'
import { initiatePayment } from './actions'

const CARD_STYLE = {
  background: 'rgba(134,96,239,0.55)',
  border: '1px solid rgba(255,255,255,0.18)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
} as const

interface FormData {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp: string
  ciudad: string
  fecha_nacimiento: string
}

const initialForm: FormData = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  whatsapp: '',
  ciudad: '',
  fecha_nacimiento: '',
}

const PLAN_BENEFITS = [
  'Teleconsultas médicas ilimitadas · DOC24',
  'Urgencias médicas 24/7',
  'Descuentos hasta 50% en farmacias',
  'Guardias odontológicas de urgencia',
]

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '0.9rem',
          colorScheme: 'dark',
          color: 'white',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(134,96,239,0.7)'
          e.target.style.background = 'rgba(255,255,255,0.1)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.12)'
          e.target.style.background = 'rgba(255,255,255,0.07)'
        }}
      />
    </div>
  )
}

function Logo() {
  return (
    <div className="text-center mb-8">
      <a href="/login" className="inline-block">
        <Image
          src="/logo.png"
          alt="Nexo by Previnca"
          width={120}
          height={48}
          style={{ objectFit: 'contain', height: '72px', width: 'auto' }}
          priority
        />
      </a>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const steps = ['Datos', 'Pagar']
  return (
    <div className="flex items-center mb-7">
      {steps.map((label, i) => {
        const num = i + 1
        const active = num === step
        const done = num < step
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, var(--purple), var(--pink))'
                    : active
                    ? 'white'
                    : 'rgba(255,255,255,0.12)',
                  color: active ? 'var(--purple)' : done ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : num}
              </div>
              <span
                className="text-[10px] font-semibold mt-1 uppercase tracking-wide"
                style={{ color: active ? 'white' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px flex-1 mb-4"
                style={{ background: done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-full font-bold text-sm transition-opacity mt-1 flex items-center justify-center gap-2"
      style={{
        background: disabled ? 'rgba(255,255,255,0.5)' : 'white',
        color: disabled ? 'rgba(134,96,239,0.6)' : 'var(--purple)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
        border: 'none',
      }}
    >
      {children}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 min-h-[44px] rounded-full text-xs font-semibold mt-2 transition-all"
      style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      ← Volver
    </button>
  )
}

interface PlanInfo {
  name: string
  price: number
}

export default function RegistroForm({ plan }: { plan: PlanInfo }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setField(field: keyof FormData) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    setError('')
    if (!form.nombre || !form.apellido || !form.dni || !form.email) {
      setError('Completá los campos obligatorios: nombre, apellido, DNI y email.')
      return
    }
    if (!/^\d{7,8}$/.test(form.dni)) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos (sin puntos ni espacios).')
      return
    }
    setStep(2)
  }

  async function handlePagar() {
    setError('')
    setLoading(true)
    try {
      const data = await initiatePayment({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        email: form.email.trim().toLowerCase(),
        whatsapp: form.whatsapp.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
      })
      if (!data.success) {
        setError(data.error)
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-sm relative z-10">
        <Logo />

        {/* ── STEP 1: DATOS ──────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="rounded-3xl p-6 sm:p-8" style={CARD_STYLE}>
            <Stepper step={1} />
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Tus datos
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Completá tu información personal
            </p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField id="nombre" label="Nombre" value={form.nombre} onChange={setField('nombre')} placeholder="Juan" required />
                <InputField id="apellido" label="Apellido" value={form.apellido} onChange={setField('apellido')} placeholder="García" required />
              </div>
              <InputField id="dni" label="DNI" value={form.dni} onChange={setField('dni')} placeholder="12345678" required />
              <InputField id="email" label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="tu@email.com" required />
              <InputField id="whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={setField('whatsapp')} placeholder="+54 9 11 1234-5678" />
              <InputField id="ciudad" label="Ciudad" value={form.ciudad} onChange={setField('ciudad')} placeholder="Buenos Aires" />
              <InputField id="fecha_nacimiento" label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={setField('fecha_nacimiento')} />

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              <PrimaryButton onClick={handleNext}>
                Ver resumen del plan
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ── STEP 2: PLAN + PAGAR ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="rounded-3xl p-6 sm:p-8" style={CARD_STYLE}>
            <Stepper step={2} />
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Tu plan
            </h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Confirmá lo que estás por contratar
            </p>

            {/* Plan card */}
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.name}</p>
                  <p className="text-base font-bold text-white">Nexo by Previnca</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>por mes</p>
                  <p className="text-xl font-bold text-white">${plan.price.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {PLAN_BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mercado Pago button */}
            <button
              type="button"
              onClick={handlePagar}
              disabled={loading}
              className="w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
              style={{
                background: loading ? 'rgba(0,158,227,0.5)' : '#009ee3',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(0,158,227,0.35)',
              }}
            >
              {loading ? (
                'Procesando...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Pagar con Mercado Pago
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Pago seguro · Mercado Pago</span>
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl mt-4" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <BackButton onClick={() => setStep(1)} />
          </div>
        )}

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Ingresar
          </a>
        </p>
      </div>
    </div>
  )
}
