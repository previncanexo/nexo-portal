'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelSection() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliates/cancel', { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Ocurrió un error. Intentá de nuevo.')
        setLoading(false)
        return
      }
      router.push('/login')
    } catch {
      setError('Error de red. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-center pt-2 pb-6">
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs transition-opacity hover:opacity-100"
          style={{ color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancelar suscripción
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="glass-card p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h3
              className="text-base font-bold text-center mb-2"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
            >
              ¿Cancelar tu suscripción?
            </h3>

            <p className="text-sm text-center mb-1" style={{ color: 'var(--gray-600)' }}>
              Vas a perder acceso a todos tus beneficios:
            </p>
            <ul className="text-xs text-center mb-5 space-y-1" style={{ color: 'var(--gray-500)' }}>
              <li>Teleconsultas DOC24</li>
              <li>Asistencia de urgencias 24/7</li>
              <li>Descuentos en farmacias (50%)</li>
              <li>Atención odontológica</li>
            </ul>

            {error && (
              <p className="text-xs text-center mb-4" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-semibold transition-opacity"
                style={{
                  background: loading ? 'rgba(239,68,68,0.5)' : '#ef4444',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                  border: 'none',
                }}
              >
                {loading ? 'Cancelando...' : 'Sí, cancelar mi suscripción'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  color: 'var(--gray-700)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                Mantener mi plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
