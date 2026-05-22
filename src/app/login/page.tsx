'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  { icon: <IconAmbulance />, label: 'Urgencias' },
  { icon: <IconPill />, label: 'Farmacias' },
  { icon: <IconTooth />, label: 'Odontología' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/login-bg.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay oscuro sobre la foto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(10,3,40,0.60) 0%, rgba(18,5,61,0.42) 50%, rgba(45,18,102,0.52) 100%)' }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.18,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="Nexo by Previnca"
            width={220}
            height={88}
            style={{ objectFit: 'contain', height: '88px', width: 'auto', margin: '0 auto' }}
            priority
          />
        </div>

        {/* Card */}
        <div className="p-7 sm:p-8 rounded-3xl" style={{ background: 'rgba(18,5,61,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 8px 40px rgba(0,0,0,0.30)' }}>
          <h2
            className="text-2xl text-white mb-1"
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
          >
            Ingresá a tu portal
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu salud, siempre cerca
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
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
                className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.95rem',
                  color: 'white',
                }}
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.95rem',
                  color: 'white',
                }}
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
            <a
              href="/forgot-password"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {/* Services strip */}
        <div className="mt-5 flex items-center justify-center gap-4 flex-wrap px-2">
          {LOGIN_SERVICES.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {s.icon}
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-dm-sans)' }}>
          ¿No tenés cuenta?{' '}
          <a
            href="/registro"
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.62)' }}
          >
            Registrarse
          </a>
        </p>
      </div>
    </div>
  )
}
