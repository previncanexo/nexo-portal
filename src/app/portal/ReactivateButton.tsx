'use client'

import { useState } from 'react'

interface Props {
  variant?: 'primary' | 'ghost'
}

export default function ReactivateButton({ variant = 'primary' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliates/reactivate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? 'No se pudo reactivar. Intentá de nuevo.')
        setLoading(false)
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      setError('Error de red. Intentá de nuevo.')
      setLoading(false)
    }
  }

  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '0.85rem',
    fontWeight: 700,
    padding: '0.55rem 1.1rem',
    borderRadius: '999px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    border: 'none',
  }

  const primaryStyle: React.CSSProperties = {
    ...baseStyle,
    background: 'linear-gradient(to right, var(--purple), var(--pink))',
    color: 'white',
    boxShadow: '0 4px 16px rgba(134,96,239,0.30)',
  }

  const ghostStyle: React.CSSProperties = {
    ...baseStyle,
    background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.30)',
    color: '#fbbf24',
  }

  return (
    <div className="mt-2 flex flex-col items-start gap-1.5">
      <button onClick={handleClick} disabled={loading} style={variant === 'primary' ? primaryStyle : ghostStyle}>
        {loading ? 'Redirigiendo…' : 'Reactivá tu suscripción'}
      </button>
      {error && (
        <p className="text-xs" style={{ color: '#fca5a5', fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
      )}
    </div>
  )
}
