'use client'

import { useState, useTransition } from 'react'
import { updateAffiliateStatus } from './actions'
import type { AffiliateStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: AffiliateStatus; label: string }[] = [
  { value: 'active',    label: 'Afiliado' },
  { value: 'pending',   label: 'Pendiente' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'cancelled', label: 'Cancelado' },
]

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--gray-200)',
  background: 'var(--gray-100)',
  color: 'var(--gray-900)',
  fontFamily: 'var(--font-dm-sans)',
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--gray-500)',
  fontFamily: 'var(--font-dm-sans)',
}

interface StatusFormProps {
  affiliateId: string
  currentStatus: AffiliateStatus
  coberturaDesde?: string | null
  coberturaHasta?: string | null
}

/** Convert a full ISO datetime string to the YYYY-MM-DD format expected by <input type="date"> */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export default function StatusForm({
  affiliateId,
  currentStatus,
  coberturaDesde,
  coberturaHasta,
}: StatusFormProps) {
  const [selected, setSelected] = useState<AffiliateStatus>(currentStatus)
  const [desde, setDesde] = useState(toDateInputValue(coberturaDesde))
  const [hasta, setHasta] = useState(toDateInputValue(coberturaHasta))
  const [message, setMessage] = useState<{ text: string; ok: boolean; warn?: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateAffiliateStatus(affiliateId, selected, desde, hasta)
      // mpReactivationWarning: success=true but message contains a warning
      const isWarning = result.success && result.message !== 'Estado actualizado correctamente.'
      setMessage({ text: result.message, ok: result.success, warn: isWarning })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Status select */}
      <div>
        <label
          htmlFor="status-select"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          Estado
        </label>
        <select
          id="status-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value as AffiliateStatus)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={inputStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Coverage from */}
      <div>
        <label
          htmlFor="cobertura-desde"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          Cobertura desde
        </label>
        <input
          id="cobertura-desde"
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      {/* Coverage to */}
      <div>
        <label
          htmlFor="cobertura-hasta"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          Cobertura hasta
        </label>
        <input
          id="cobertura-hasta"
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      {message && (
        <p
          className="text-sm px-4 py-2.5 rounded-xl"
          style={{
            background: message.warn
              ? 'rgba(217,119,6,0.10)'
              : message.ok
                ? 'rgba(22,163,74,0.08)'
                : 'rgba(220,38,38,0.08)',
            border: `1px solid ${
              message.warn
                ? 'rgba(217,119,6,0.25)'
                : message.ok
                  ? 'rgba(22,163,74,0.2)'
                  : 'rgba(220,38,38,0.2)'
            }`,
            color: message.warn ? '#d97706' : message.ok ? '#16a34a' : '#dc2626',
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
