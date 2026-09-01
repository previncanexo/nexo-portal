'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoNexo from '../components/LogoNexo'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function IconVideoCamera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14" />
      <rect x="2" y="7" width="13" height="10" rx="2" />
    </svg>
  )
}

function IconAmbulance() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10l4 4v7a1 1 0 0 1-1 1h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M8 10h4M10 8v4" />
      <path d="M10 17h5" />
    </svg>
  )
}

function IconPill() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  )
}

function IconTooth() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5.5c-1.5-2-4-2.5-5.5-1S4 8 4.5 10c.3 1 .5 2 .5 3 0 2 .5 4 1.5 5.5.5.8 1 1.5 1.5 1.5s1-1 1.5-2.5c.3-1 .5-2 .5-3 0 1 .2 2 .5 3 .5 1.5 1 2.5 1.5 2.5s1-.7 1.5-1.5C18.5 17 19 15 19 13c0-1 .2-2 .5-3 .5-2-.5-4.5-2-6S13.5 3.5 12 5.5Z" />
    </svg>
  )
}

const LOGIN_SERVICES = [
  { icon: <IconVideoCamera />, label: 'DOC24' },
  { icon: <IconAmbulance />, label: 'Emergencias médicas' },
  { icon: <IconPill />, label: 'Farmacias' },
  { icon: <IconTooth />, label: 'Odontología' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email o contraseña incorrectos. Verificá tus datos.')
      setLoading(false)
      return
    }

    router.push('/api/auth/redirect')
  }

  return (
    <div className="portal-claro min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/*
        Antes esto era una foto con overlay oscuro encima: el formulario caia
        sobre una cara y el contraste dependia de que tan oscuro fuera el
        overlay. Ahora el fondo es el degrade de marca y la atencion queda
        donde tiene que estar, que es el formulario.
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="hidden sm:block absolute -top-32 -left-32 w-[460px] h-[460px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(134,96,239,0.26) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="hidden sm:block absolute -bottom-40 -right-24 w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(238,92,208,0.20) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
            <LogoNexo alto={72} />
          </div>

        {/* Card */}
        <div
          className="p-7 sm:p-9"
          style={{
            background: 'var(--superficie-card)',
            border: '1px solid var(--borde)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--sombra-elevada)',
          }}
        >
          <h2 className="text-2xl mb-1" style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--texto-fuerte)' }}>
            Ingresá a tu portal
          </h2>
          <p className="text-sm mb-7" style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu salud, siempre cerca
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--texto)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'var(--superficie-sutil)',
                  border: '1px solid var(--borde-fuerte)',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.95rem',
                  color: 'var(--texto-fuerte)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid var(--acento)'
                  e.target.style.background = 'var(--superficie-sutil)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid var(--borde-fuerte)'
                  e.target.style.background = 'var(--superficie-sutil)'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--texto)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all"
                  style={{
                    background: 'var(--superficie-sutil)',
                    border: '1px solid var(--borde-fuerte)',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.95rem',
                    color: 'var(--texto-fuerte)',
                    colorScheme: 'light',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--acento)'
                    e.target.style.background = 'var(--superficie-sutil)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid var(--borde-fuerte)'
                    e.target.style.background = 'var(--superficie-sutil)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  tabIndex={-1}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--texto-tenue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--texto-tenue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.30)',
                  color: '#fca5a5',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-bold text-sm text-white transition-all mt-2"
              style={{
                background: 'linear-gradient(to right, var(--purple), var(--pink))',
                opacity: loading ? 0.55 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(134,96,239,0.30)',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/forgot-password"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'var(--texto-tenue)', fontFamily: 'var(--font-dm-sans)' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Services strip */}
        <div className="mt-5 flex items-center justify-center gap-4 flex-wrap px-2">
          {LOGIN_SERVICES.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5"
              style={{ color: 'var(--texto-tenue)' }}
            >
              {s.icon}
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--texto-tenue)', fontFamily: 'var(--font-dm-sans)' }}>
          ¿No tenés cuenta?{' '}
          <a
            href={`${process.env.NEXT_PUBLIC_LANDING_URL ?? 'https://nexo.previncasalud.com.ar'}/onboarding/afiliado`}
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'var(--texto-suave)' }}
          >
            Registrarse
          </a>
        </p>
      </div>
    </div>
  )
}
