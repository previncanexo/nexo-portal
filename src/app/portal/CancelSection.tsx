'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'pending' | 'active' | 'suspended' | 'cancelled'

export default function CancelSection({ status }: { status: Status }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (status === 'cancelled' || status === 'suspended') return null

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
      {/* Section label + card */}
      <div>
        <p
          className="text-xs uppercase tracking-[0.14em] font-semibold mb-3"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Gestionar suscripción
        </p>
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
            Podés cancelar tu suscripción en cualquier momento. Perderás el acceso a todos los beneficios.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(10px)' }}
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="glass-card p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h3
              className="text-base sm:text-lg font-bold text-center mb-2"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
            >
              ¿Cancelar tu suscripción?
            </h3>

            <p className="text-sm text-center mb-1" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
              Vas a perder acceso a todos tus beneficios:
            </p>
            <ul className="text-sm text-center mb-5 space-y-1" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
              <li>Teleconsultas DOC24</li>
              <li>Asistencia de urgencias 24/7</li>
              <li>Descuentos en farmacias (50%)</li>
              <li>Atención odontológica</li>
            </ul>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-bold transition-all"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                  opacity: loading ? 0.55 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {loading ? 'Cancelando...' : 'Sí, cancelar mi suscripción'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-semibold transition-all"
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
