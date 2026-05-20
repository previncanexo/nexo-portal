'use client'

import { useState, useTransition } from 'react'
import { updateAffiliateNotes } from './actions'

export default function NotesForm({
  affiliateId,
  initialNotes,
}: {
  affiliateId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateAffiliateNotes(affiliateId, notes)
      setMessage({ text: result.message, ok: result.success })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Observaciones internas sobre el afiliado..."
        className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
        style={{
          border: '1px solid var(--gray-200)',
          background: 'var(--gray-100)',
          color: 'var(--gray-900)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />

      {message && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
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
        type="submit"
        disabled={isPending}
        className="self-start px-5 py-2 rounded-full text-sm font-semibold transition-opacity"
        style={{
          background: isPending ? 'rgba(134,96,239,0.5)' : 'var(--purple)',
          color: 'white',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {isPending ? 'Guardando...' : 'Guardar notas'}
      </button>
    </form>
  )
}
