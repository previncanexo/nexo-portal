'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { refundLastPayment } from './actions'

interface RefundButtonProps {
  affiliateId: string
  lastAmount: number | null
  currency: string
}

export default function RefundButton({ affiliateId, lastAmount, currency }: RefundButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const router = useRouter()

  // Sin pagos aprobados para devolver → no mostramos el botón
  if (lastAmount == null) {
    return (
      <p className="text-sm" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
        No hay pagos aprobados para devolver.
      </p>
    )
  }

  function handleRefund() {
    setMessage(null)
    startTransition(async () => {
      const result = await refundLastPayment(affiliateId)
      setMessage({ text: result.message, ok: result.success })
      setConfirming(false)
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {!confirming ? (
        <button
          onClick={() => { setMessage(null); setConfirming(true) }}
          className="self-start px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(220,38,38,0.10)',
            color: '#dc2626',
            border: '1px solid rgba(220,38,38,0.25)',
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Devolución
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--gray-700)', fontFamily: 'var(--font-dm-sans)' }}>
            ¿Confirmás la devolución del último pago aprobado de{' '}
            <strong>{currency} {lastAmount.toLocaleString('es-AR')}</strong>? Se procesa en
            Mercado Pago (si corresponde) y se registra una nota de crédito.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefund}
              disabled={isPending}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'rgba(220,38,38,0.85)', color: 'white', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans)' }}
            >
              {isPending ? 'Procesando...' : 'Confirmar devolución'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--gray-600)', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
            >
              No
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className="text-sm px-4 py-2.5 rounded-xl"
          style={{
            background: message.ok ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${message.ok ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
            color: message.ok ? '#16a34a' : '#dc2626',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
