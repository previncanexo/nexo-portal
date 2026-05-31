'use client'

import { useState, useTransition } from 'react'
import { sendAffiliatePasswordReset } from './actions'

export default function ResetPasswordButton({ affiliateId }: { affiliateId: string }) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleReset() {
    setMessage(null)
    startTransition(async () => {
      const result = await sendAffiliatePasswordReset(affiliateId)
      setMessage({ text: result.message, ok: result.success })
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--gray-700)', fontFamily: 'var(--font-dm-sans)' }}>
        Enviá un link de restablecimiento al email del afiliado.
      </p>
      {message && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
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
      <button
        onClick={handleReset}
        disabled={isPending}
        className="self-start px-5 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{
          background: 'rgba(134,96,239,0.15)',
          color: 'var(--purple)',
          border: '1px solid rgba(134,96,239,0.3)',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {isPending ? 'Enviando...' : 'Enviar reset de contraseña'}
      </button>
    </div>
  )
}
