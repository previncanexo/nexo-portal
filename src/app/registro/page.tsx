'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { CreateAffiliateResponse } from '@/lib/types'

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
        style={{ color: 'rgba(255,255,255,0.75)' }}
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
        className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '0.9rem',
          colorScheme: 'dark',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(134,96,239,0.8)'
          e.target.style.background = 'rgba(255,255,255,0.12)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.18)'
          e.target.style.background = 'rgba(255,255,255,0.08)'
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
          style={{ objectFit: 'contain', height: '40px', width: 'auto' }}
          priority
        />
      </a>
    </div>
  )
}

export default function RegistroPage() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CreateAffiliateResponse | null>(null)

  function setField(field: keyof FormData) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni.trim(),
          email: form.email.trim().toLowerCase(),
          whatsapp: form.whatsapp.trim() || undefined,
          ciudad: form.ciudad.trim() || undefined,
          fecha_nacimiento: form.fecha_nacimiento || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al registrar. Intentá de nuevo.')
        return
      }

      setResult(data as CreateAffiliateResponse)
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm relative z-10">
          <Logo />

          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="text-2xl font-normal text-white mb-2" style={{ fontFamily: 'var(--font-dm-serif)' }}>
              ¡Registro exitoso!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Tu cuenta fue creada. Guardá estos datos para ingresar al portal.
            </p>

            <div
              className="rounded-xl p-4 mb-3 text-left"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Número de afiliado</p>
              <p
                className="text-xl font-bold tracking-widest"
                style={{
                  fontFamily: 'monospace',
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {result.affiliate_number}
              </p>
            </div>

            <div
              className="rounded-xl p-4 mb-4 text-left"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Credenciales de acceso</p>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Email: </span>
                  <span className="text-sm text-white">{result.email}</span>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Contraseña temporal: </span>
                  <span className="text-sm font-bold tracking-wider text-white" style={{ fontFamily: 'monospace' }}>
                    {result.temp_password}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="text-xs px-4 py-3 rounded-xl mb-6"
              style={{
                background: 'rgba(250,204,21,0.1)',
                border: '1px solid rgba(250,204,21,0.25)',
                color: 'rgba(250,204,21,0.9)',
              }}
            >
              Guardá esta contraseña. Te recomendamos cambiarla al ingresar por primera vez.
            </div>

            <a
              href="/login"
              className="block w-full py-3 rounded-full text-white font-bold text-sm text-center transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Ingresar al portal
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm relative z-10">
        <Logo />

        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Crear cuenta
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Completá tus datos para afiliarte
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-white font-bold text-sm transition-opacity mt-1"
              style={{
                background: loading
                  ? 'rgba(134,96,239,0.5)'
                  : 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="underline hover:opacity-80 transition-opacity" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Ingresar
          </a>
        </p>
      </div>
    </div>
  )
}
