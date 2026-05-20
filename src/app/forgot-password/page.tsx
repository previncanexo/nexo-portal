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
    <div className="min-h-screen flex items-start justify-center px-4 py-12 relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
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

        <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(134,96,239,0.55)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
          {sent ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Revisá tu email
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Te enviamos un email con las instrucciones para recuperar tu contraseña.
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-xl font-semibold text-white mb-1"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Recuperar contraseña
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Ingresá tu email y te enviamos las instrucciones.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
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
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all"
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
                  className="w-full py-3 rounded-full font-semibold text-sm transition-opacity mt-2"
                  style={{
                    background: loading ? 'rgba(255,255,255,0.5)' : 'white',
                    color: loading ? 'rgba(134,96,239,0.6)' : 'var(--purple)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-dm-sans)',
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
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              ← Volver al login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
