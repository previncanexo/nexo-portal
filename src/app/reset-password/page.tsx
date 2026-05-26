'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const fieldBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.95rem',
  color: 'white',
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Si en 12s no llega el evento, el link es inválido o expiró
    const timeout = setTimeout(() => {
      setExpired(true)
    }, 12000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Cuando ready se activa, cancelar el timeout de expiración
  useEffect(() => {
    if (ready) setExpired(false)
  }, [ready])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError('No se pudo actualizar la contraseña. Intentá nuevamente.')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/portal'), 2500)
  }

  const eyeIcon = (visible: boolean) => visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute pointer-events-none" style={{ top: '-80px', left: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--purple)', opacity: 0.06, filter: 'blur(130px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'var(--pink)', opacity: 0.05, filter: 'blur(110px)' }} />
      <div className="pointer-events-none fixed inset-0" style={{ opacity: 0.15, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")", mixBlendMode: 'overlay' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <Link href="/login">
            <Image src="/logo.png" alt="Nexo by Previnca" width={220} height={88} style={{ objectFit: 'contain', height: '88px', width: 'auto', margin: '0 auto' }} priority />
          </Link>
        </div>

        <div className="glass-card p-7 sm:p-8">

          {/* Éxito */}
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', boxShadow: '0 8px 24px rgba(134,96,239,0.30)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-2xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}>
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)' }}>
                Redirigiendo a tu portal...
              </p>
            </div>
          ) : expired && !ready ? (
            /* Link expirado */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="text-xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}>
                El enlace expiró
              </h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)' }}>
                Este link de recuperación ya no es válido. Solicitá uno nuevo.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full py-3 rounded-full font-bold text-sm text-center text-white"
                style={{ background: 'linear-gradient(to right, var(--purple), var(--pink))', fontFamily: 'var(--font-dm-sans)', boxShadow: '0 8px 24px rgba(134,96,239,0.25)' }}
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : (
            /* Formulario */
            <>
              <h2 className="text-2xl text-white mb-1" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}>
                Nueva contraseña
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
                {ready ? 'Elegí tu nueva contraseña.' : 'Verificando el enlace...'}
              </p>

              {!ready ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid rgba(134,96,239,0.30)', borderTopColor: 'var(--purple)' }} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Nueva contraseña */}
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Mínimo 8 caracteres"
                        className="w-full px-4 py-3 pr-11 rounded-xl text-white outline-none transition-all"
                        style={{ ...fieldBase, colorScheme: 'dark' }}
                        onFocus={(e) => { e.target.style.border = '1px solid rgba(134,96,239,0.70)'; e.target.style.background = 'rgba(255,255,255,0.10)' }}
                        onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" tabIndex={-1} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {eyeIcon(showNew)}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repetí la contraseña"
                        className="w-full px-4 py-3 pr-11 rounded-xl text-white outline-none transition-all"
                        style={{ ...fieldBase, colorScheme: 'dark' }}
                        onFocus={(e) => { e.target.style.border = '1px solid rgba(134,96,239,0.70)'; e.target.style.background = 'rgba(255,255,255,0.10)' }}
                        onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" tabIndex={-1} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        {eyeIcon(showConfirm)}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full font-bold text-sm text-white transition-all mt-2"
                    style={{ background: 'linear-gradient(to right, var(--purple), var(--pink))', opacity: loading ? 0.55 : 1, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans)', boxShadow: loading ? 'none' : '0 8px 24px rgba(134,96,239,0.30)', border: 'none' }}
                  >
                    {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                  </button>
                </form>
              )}
            </>
          )}

          {!done && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
                ← Volver al login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
