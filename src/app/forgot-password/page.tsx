'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Orb purple */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px',
          left: '-120px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'var(--purple)',
          opacity: 0.06,
          filter: 'blur(130px)',
        }}
      />
      {/* Orb pink */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-100px',
          right: '-100px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'var(--pink)',
          opacity: 0.05,
          filter: 'blur(110px)',
        }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.15,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
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

        <div className="glass-card p-7 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                  boxShadow: '0 8px 24px rgba(134,96,239,0.30)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-2xl text-white mb-3"
                style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
              >
                Revisá tu email
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
                Te enviamos un email con las instrucciones para recuperar tu contraseña.
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-2xl text-white mb-1"
                style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
              >
                Recuperar contraseña
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
                Ingresá tu email y te enviamos las instrucciones.
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
                  {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
            >
              ← Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
