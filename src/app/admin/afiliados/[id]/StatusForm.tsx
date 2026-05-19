'use client'

import { useState, useTransition } from 'react'
import { updateAffiliateStatus } from './actions'
import type { AffiliateStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: AffiliateStatus; label: string }[] = [
  { value: 'active',    label: 'Activo' },
  { value: 'pending',   label: 'Pendiente' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'cancelled', label: 'Cancelado' },
]

interface StatusFormProps {
  affiliateId: string
  currentStatus: AffiliateStatus
}

export default function StatusForm({ affiliateId, currentStatus }: StatusFormProps) {
  const [selected, setSelected] = useState<AffiliateStatus>(currentStatus)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateAffiliateStatus(affiliateId, selected)
      setMessage({ text: result.message, ok: result.success })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="status-select"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Estado
        </label>
        <select
          id="status-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value as AffiliateStatus)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(0,0,0,0.03)',
            color: 'var(--gray-900)',
            fontFamily: 'var(--font-dm-sans)',
            cursor: 'pointer',
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity"
        style={{
          background: isPending ? 'rgba(134,96,239,0.5)' : 'var(--purple)',
          color: 'white',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-dm-sans)',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
