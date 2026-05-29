'use client'

import { useState } from 'react'
import { retryPayment } from './actions'

export default function RetryPaymentButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    setCheckoutUrl('')
    try {
      const result = await retryPayment()
      if (!result.success) {
        setError(result.error)
        return
      }
      setCheckoutUrl(result.checkoutUrl)
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checkoutUrl) {
    return (
      <div
        className="flex flex-col gap-4 rounded-2xl p-5 max-w-sm w-full text-left"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.20)' }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Antes de continuar, verificá tu cuenta de Mercado Pago
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'var(--font-dm-sans)' }}>
            Debés pagar con el email exacto con el que te registraste en Nexo:
          </p>
          <p
            className="text-xs font-bold mt-1 px-3 py-1.5 rounded-full inline-block self-start"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontFamily: 'var(--font-dm-sans)' }}
          >
            {email}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
            Si ya estás logueado en Mercado Pago con otra cuenta, cerrá sesión allí primero y volvé a intentarlo.
          </p>
        </div>
        <a
          href={checkoutUrl}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white text-center"
          style={{
            background: 'linear-gradient(to right, var(--purple), var(--pink))',
            fontFamily: 'var(--font-dm-sans)',
            boxShadow: '0 4px 16px rgba(134,96,239,0.25)',
            textDecoration: 'none',
          }}
        >
          Entendido, ir a Mercado Pago →
        </a>
        <button
          onClick={() => setCheckoutUrl('')}
          className="text-xs text-center"
          style={{ color: 'rgba(255,255,255,0.30)', fontFamily: 'var(--font-dm-sans)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white transition-all"
        style={{
          background: 'linear-gradient(to right, var(--purple), var(--pink))',
          opacity: loading ? 0.55 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          border: 'none',
          fontFamily: 'var(--font-dm-sans)',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(134,96,239,0.25)',
        }}
      >
        {loading ? 'Generando link de pago...' : 'Completar pago con Mercado Pago'}
      </button>
      {error && (
        <p className="text-xs text-center" style={{ color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
      )}
    </div>
  )
}
