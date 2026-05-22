'use client'

import { useState } from 'react'
import { retryPayment } from './actions'

export default function RetryPaymentButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const result = await retryPayment()
      if (!result.success) {
        setError(result.error)
        return
      }
      window.location.href = result.checkoutUrl
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
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
        {loading ? 'Redirigiendo...' : 'Completar pago con Mercado Pago'}
      </button>
      {error && (
        <p className="text-xs text-center" style={{ color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
      )}
    </div>
  )
}
