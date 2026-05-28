'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { initiatePayment } from './actions'

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
  { label: 'Teleconsultas médicas ilimitadas · DOC24', icon: '🩺' },
  { label: 'Descuentos hasta 50% en farmacias', icon: '💊' },
  { label: 'Urgencias médicas 24/7', icon: '🚑' },
  { label: 'Guardias odontológicas de urgencia', icon: '🦷' },
]

const fieldBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.95rem',
  color: 'white',
}

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
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
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
        style={{ ...fieldBase, colorScheme: 'dark' }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(134,96,239,0.70)'
          e.target.style.background = 'rgba(255,255,255,0.10)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.15)'
          e.target.style.background = 'rgba(255,255,255,0.07)'
        }}
      />
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  id: string
  label: string
  value: string
  onChange: (val: string) => void
  required?: boolean
}) {
  const isoToDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return y && m && d ? `${d}/${m}/${y}` : ''
  }

  const [display, setDisplay] = useState(() => isoToDisplay(value))

  useEffect(() => {
    setDisplay(isoToDisplay(value))
  }, [value])

  function handleType(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setDisplay(formatted)
    if (digits.length === 8) {
      const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4)
      onChange(`${y}-${m}-${d}`)
    } else {
      onChange('')
    }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    setDisplay(isoToDisplay(e.target.value))
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleType}
          placeholder="DD/MM/AAAA"
          required={required}
          className="w-full px-4 py-3 pr-10 rounded-xl text-white outline-none transition-all"
          style={{ ...fieldBase, colorScheme: 'dark', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}
          onFocus={(e) => {
            e.target.style.border = '1px solid rgba(134,96,239,0.70)'
            e.target.style.background = 'rgba(255,255,255,0.10)'
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid rgba(255,255,255,0.15)'
            e.target.style.background = 'rgba(255,255,255,0.07)'
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="date"
            value={value}
            onChange={handlePickerChange}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full rounded cursor-pointer"
            style={{ opacity: 0.001, colorScheme: 'dark' }}
          />
        </div>
      </div>
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
                style={{ color: active ? 'white' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans)' }}
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
      className="w-full py-3 rounded-full font-bold text-sm text-white transition-all mt-1 flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(to right, var(--purple), var(--pink))',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
        border: 'none',
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(134,96,239,0.30)',
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
      style={{ color: 'rgba(255,255,255,0.45)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
    >
      ← Volver
    </button>
  )
}

interface PlanInfo {
  id: string
  name: string
  price: number
}

export default function RegistroForm({ plans }: { plans: PlanInfo[] }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo>(plans[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasMultiplePlans = plans.length > 1

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
        plan_id: selectedPlan.id || undefined,
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
    <div
      className="min-h-screen lg:grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #12053d 0%, #2d1266 40%, #6535cc 100%)' }}
    >
      {/* ── PANEL IZQUIERDO — branding (solo desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          backgroundImage: 'url(/registro-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,3,40,0.72) 0%, rgba(45,18,102,0.58) 50%, rgba(101,53,204,0.45) 100%)' }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.15,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: 'overlay',
          }}
        />

        {/* Decorative arcs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 900" fill="none">
          <ellipse cx="500" cy="450" rx="400" ry="500" stroke="rgba(255,255,255,0.04)" strokeWidth="80"/>
          <ellipse cx="80" cy="820" rx="200" ry="180" stroke="rgba(201,79,181,0.07)" strokeWidth="50"/>
        </svg>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <div>
            <a href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Nexo by Previnca"
                width={180}
                height={72}
                style={{ objectFit: 'contain', height: '64px', width: 'auto' }}
                priority
              />
            </a>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">

            <h1
              className="text-white leading-[1.06] tracking-[-1.5px] mb-8"
              style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 'clamp(40px, 4.5vw, 64px)' }}
            >
              Tu salud,<br />
              digitalmente<br />
              simple
            </h1>

            <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.65, maxWidth: '340px' }}>
              Cobertura médica completa en minutos, sin papeles ni trámites presenciales.
            </p>

            {/* Benefits */}
            <div className="flex flex-col gap-3.5">
              {PLAN_BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', boxShadow: '0 4px 12px rgba(134,96,239,0.25)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-dm-sans)' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price footer */}
          <div
            className="rounded-2xl p-5 mt-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>{selectedPlan.name} · Mensual</p>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>Nexo by Previnca</p>
              </div>
              <div className="text-right">
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>por mes</p>
                <p
                  className="font-bold leading-none"
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3vw, 40px)', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  ${selectedPlan.price.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO — form ── */}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-12 relative"
        style={{ background: 'rgba(8,2,28,0.60)', backdropFilter: 'blur(0px)' }}
      >
        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.16,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: 'overlay',
          }}
        />

        <div className="w-full max-w-sm lg:max-w-[460px] relative z-10">
          {/* Logo — solo mobile */}
          <div className="text-center mb-8 lg:hidden">
            <a href="/login" className="inline-block">
              <Image
                src="/logo.png"
                alt="Nexo by Previnca"
                width={200}
                height={80}
                style={{ objectFit: 'contain', height: '80px', width: 'auto' }}
                priority
              />
            </a>
          </div>

          {/* Heading */}
          <div className="mb-6 lg:mb-8">
            <h2
              className="text-2xl sm:text-3xl text-white mb-2"
              style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
            >
              {step === 1 ? 'Tus datos' : 'Resumen del plan'}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
              {step === 1 ? 'Completá la información para crear tu cuenta' : 'Revisá tu plan antes de pagar'}
            </p>
          </div>

          {/* ── STEP 1: DATOS ── */}
          {step === 1 && (
            <div
              className="p-6 sm:p-7 rounded-3xl"
              style={{ background: 'rgba(18,5,61,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}
            >
              <Stepper step={1} />

              {/* Plan selector — always visible in step 1 */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.42)', fontFamily: 'var(--font-dm-sans)' }}>
                  Plan seleccionado
                </p>
                <div className={`grid gap-2 ${hasMultiplePlans ? 'grid-cols-1' : ''}`}>
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all"
                      style={{
                        background: selectedPlan.id === p.id ? 'rgba(134,96,239,0.18)' : 'rgba(255,255,255,0.06)',
                        border: selectedPlan.id === p.id ? '1.5px solid rgba(134,96,239,0.65)' : '1px solid rgba(255,255,255,0.12)',
                        cursor: hasMultiplePlans ? 'pointer' : 'default',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: selectedPlan.id === p.id ? 'var(--purple)' : 'rgba(255,255,255,0.25)',
                            background: selectedPlan.id === p.id ? 'var(--purple)' : 'transparent',
                          }}
                        >
                          {selectedPlan.id === p.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          ${p.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>/mes</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField id="nombre" label="Nombre" value={form.nombre} onChange={setField('nombre')} placeholder="Juan" required />
                  <InputField id="apellido" label="Apellido" value={form.apellido} onChange={setField('apellido')} placeholder="García" required />
                </div>
                <InputField id="dni" label="DNI" value={form.dni} onChange={setField('dni')} placeholder="12345678" required />
                <InputField id="email" label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="tu@email.com" required />
                <InputField id="whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={setField('whatsapp')} placeholder="+54 9 11 1234-5678" />
                <InputField id="ciudad" label="Ciudad" value={form.ciudad} onChange={setField('ciudad')} placeholder="Rosario" />
                <DateField id="fecha_nacimiento" label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={setField('fecha_nacimiento')} />

                {error && (
                  <div
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {error}
                  </div>
                )}

                <PrimaryButton onClick={handleNext}>
                  Siguiente
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* ── STEP 2: PLAN + PAGAR ── */}
          {step === 2 && (
            <div
              className="p-6 sm:p-7 rounded-3xl"
              style={{ background: 'rgba(18,5,61,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}
            >
              <Stepper step={2} />

              {/* Datos ingresados — resumen compacto */}
              <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <div>
                  <p className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {form.nombre} {form.apellido}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>{form.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs underline flex-shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(255,255,255,0.50)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Editar
                </button>
              </div>

              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>Nexo by Previnca</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>por mes</p>
                    <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>${selectedPlan.price.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {PLAN_BENEFITS.map((b) => (
                    <div key={b.label} className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-dm-sans)' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePagar}
                disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
                style={{
                  background: loading ? 'rgba(0,158,227,0.50)' : '#009ee3',
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
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans)' }}>Pago seguro · Mercado Pago</span>
              </div>

              {error && (
                <div
                  className="text-sm px-4 py-3 rounded-xl mt-4"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {error}
                </div>
              )}

              <BackButton onClick={() => setStep(1)} />
            </div>
          )}

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>
            ¿Ya tenés cuenta?{' '}
            <a href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.62)' }}>
              Ingresar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
