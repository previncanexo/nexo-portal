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
    <div className="mt-3 flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-2.5 rounded-full text-sm font-bold transition-opacity"
        style={{
          background: loading ? 'rgba(0,158,227,0.5)' : '#009ee3',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          border: 'none',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {loading ? 'Redirigiendo...' : 'Completar pago con Mercado Pago'}
      </button>
      {error && (
        <p className="text-xs text-center" style={{ color: '#fca5a5' }}>{error}</p>
      )}
    </div>
  )
}
