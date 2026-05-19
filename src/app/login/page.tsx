'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

    router.push('/portal')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)',
      }}
    >
      {/* Decorative orbs */}
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
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-normal mb-2"
            style={{
              fontFamily: 'var(--font-dm-serif)',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            nexo
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            by Previnca
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2
            className="text-xl font-semibold text-white mb-1"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Ingresá a tu portal
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Accedé a todos tus beneficios de salud
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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'rgba(255,255,255,0.7)' }}
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
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity mt-2"
              style={{
                background: loading
                  ? 'rgba(134,96,239,0.5)'
                  : 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a
              href="#"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ¿No tenés cuenta?{' '}
          <a
            href="/registro"
            className="underline hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Registrarse
          </a>
        </p>
      </div>
    </div>
  )
}
