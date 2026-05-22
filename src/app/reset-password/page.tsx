'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Supabase procesa el hash de la URL y emite PASSWORD_RECOVERY.
    // Hasta que el evento llegue, el formulario no se habilita para evitar
    // que updateUser se llame sin sesión válida.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/portal')
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
          <h1
            className="text-5xl font-normal mb-1"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: 'italic',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            nexo
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.875rem', fontFamily: 'var(--font-dm-sans)' }}>
            by Previnca
          </p>
        </div>

        <div className="glass-card p-7 sm:p-8">
          <h2
            className="text-2xl text-white mb-1"
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
          >
            Nueva contraseña
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
            {ready ? 'Elegí tu nueva contraseña.' : 'Verificando el enlace...'}
          </p>

          {!ready ? (
            <div className="flex justify-center py-6">
              <div
                className="w-8 h-8 rounded-full animate-spin"
                style={{ border: '2px solid rgba(134,96,239,0.30)', borderTopColor: 'var(--purple)' }}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
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
