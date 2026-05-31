'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePayment } from './actions'

export default function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deletePayment(paymentId)
      router.refresh()
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 whitespace-nowrap"
        style={{ background: 'rgba(220,38,38,0.08)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
      >
        Eliminar
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 disabled:opacity-50 whitespace-nowrap"
        style={{ background: 'rgba(220,38,38,0.8)', color: 'white', cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans)' }}
      >
        {isPending ? '...' : 'Confirmar'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 whitespace-nowrap"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
      >
        No
      </button>
    </div>
  )
}
