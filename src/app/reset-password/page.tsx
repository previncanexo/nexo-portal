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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-normal mb-1"
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

        <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <h2
            className="text-xl font-semibold text-white mb-1"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Nueva contraseña
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {ready ? 'Elegí tu nueva contraseña.' : 'Verificando el enlace...'}
          </p>

          {!ready ? (
            <div className="flex justify-center py-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(134,96,239,0.6)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
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
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
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
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
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
