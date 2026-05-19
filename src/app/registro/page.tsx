'use client'

import { useState } from 'react'
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
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--pink)', marginLeft: 2 }}>*</span>
        )}
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
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '0.95rem',
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid rgba(134,96,239,0.7)'
          e.target.style.background = 'rgba(255,255,255,0.1)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255,255,255,0.15)'
          e.target.style.background = 'rgba(255,255,255,0.07)'
        }}
      />
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

  // Success screen
  if (result) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{
          background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)',
        }}
      >
        <div
          className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'var(--purple)' }}
        />
        <div
          className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'var(--pink)' }}
        />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <span
              className="text-4xl font-normal"
              style={{
                fontFamily: 'var(--font-dm-serif)',
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nexo
            </span>
          </div>

          <div className="glass-card p-8 text-center" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            {/* Check icon */}
            <div
              className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2
              className="text-2xl font-normal text-white mb-2"
              style={{ fontFamily: 'var(--font-dm-serif)' }}
            >
              ¡Registro exitoso!
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Tu cuenta fue creada. Guardá estos datos para ingresar al portal.
            </p>

            {/* Affiliate number */}
            <div
              className="rounded-xl p-4 mb-4 text-left"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Número de afiliado
              </p>
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

            {/* Credentials */}
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Credenciales de acceso
              </p>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Email: </span>
                  <span className="text-sm text-white">{result.email}</span>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Contraseña temporal: </span>
                  <span
                    className="text-sm font-bold tracking-wider"
                    style={{ fontFamily: 'monospace', color: 'white' }}
                  >
                    {result.temp_password}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="text-xs px-4 py-3 rounded-xl mb-6"
              style={{
                background: 'rgba(250,204,21,0.1)',
                border: '1px solid rgba(250,204,21,0.2)',
                color: 'rgba(250,204,21,0.8)',
              }}
            >
              Guardá esta contraseña. Te recomendamos cambiarla al ingresar por primera vez.
            </div>

            <a
              href="/login"
              className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-opacity hover:opacity-80"
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

  // Registration form
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)',
      }}
    >
      <div
        className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'var(--purple)' }}
      />
      <div
        className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'var(--pink)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/login">
            <span
              className="text-4xl font-normal"
              style={{
                fontFamily: 'var(--font-dm-serif)',
                background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nexo
            </span>
          </a>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            by Previnca
          </p>
        </div>

        <div className="glass-card p-8" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
          <h2
            className="text-xl font-semibold text-white mb-1"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Crear cuenta
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Completá tus datos para afiliarte
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                id="nombre"
                label="Nombre"
                value={form.nombre}
                onChange={setField('nombre')}
                placeholder="Juan"
                required
              />
              <InputField
                id="apellido"
                label="Apellido"
                value={form.apellido}
                onChange={setField('apellido')}
                placeholder="García"
                required
              />
            </div>

            <InputField
              id="dni"
              label="DNI"
              type="text"
              value={form.dni}
              onChange={setField('dni')}
              placeholder="12345678"
              required
            />

            <InputField
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={setField('email')}
              placeholder="tu@email.com"
              required
            />

            <InputField
              id="whatsapp"
              label="WhatsApp"
              type="tel"
              value={form.whatsapp}
              onChange={setField('whatsapp')}
              placeholder="+54 9 11 1234-5678"
            />

            <InputField
              id="ciudad"
              label="Ciudad"
              value={form.ciudad}
              onChange={setField('ciudad')}
              placeholder="Buenos Aires"
            />

            <InputField
              id="fecha_nacimiento"
              label="Fecha de nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={setField('fecha_nacimiento')}
            />

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity mt-1"
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

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ¿Ya tenés cuenta?{' '}
          <a
            href="/login"
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Ingresar
          </a>
        </p>
      </div>
    </div>
  )
}
