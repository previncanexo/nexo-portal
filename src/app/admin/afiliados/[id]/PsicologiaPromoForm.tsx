'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setPsicologiaPromoUsada } from './actions'

interface PsicologiaPromoFormProps {
  affiliateId: string
  /** Fecha ISO del consumo registrado, o null si todavía no se registró ninguno. */
  usadaEn: string | null
}

export default function PsicologiaPromoForm({ affiliateId, usadaEn }: PsicologiaPromoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const router = useRouter()

  const usada = usadaEn !== null

  function handleToggle(nextUsada: boolean) {
    setMessage(null)
    startTransition(async () => {
      const result = await setPsicologiaPromoUsada(affiliateId, nextUsada)
      setMessage({ text: result.message, ok: result.success })
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-1 px-4 py-3 rounded-xl"
        style={{
          background: usada ? 'rgba(202,138,4,0.08)' : 'rgba(22,163,74,0.08)',
          border: `1px solid ${usada ? 'rgba(202,138,4,0.22)' : 'rgba(22,163,74,0.2)'}`,
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: usada ? '#ca8a04' : '#16a34a', fontFamily: 'var(--font-dm-sans)' }}
        >
          {usada ? 'Sesión bonificada registrada' : 'Sin sesiones registradas'}
        </span>
        <span className="text-xs" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
          {usada
            ? `Registrada el ${new Date(usadaEn).toLocaleDateString('es-AR')}.`
            : 'Todavía no se registró ninguna sesión bonificada para este afiliado.'}
        </span>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
        Registro interno: no cambia lo que ve el afiliado en su portal. Todos los afiliados ven
        el mismo beneficio (una sesión a $15.000 por mes, el resto a $30.000). El cobro ocurre en
        DOC24, fuera del portal: marcá el consumo recién cuando DOC24 lo confirme.
      </p>

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
        onClick={() => handleToggle(!usada)}
        disabled={isPending}
        className="self-start px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
        style={{
          background: usada ? 'rgba(107,114,128,0.10)' : 'var(--purple)',
          color: usada ? 'var(--gray-700)' : 'white',
          border: usada ? '1px solid rgba(107,114,128,0.25)' : 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {isPending
          ? 'Guardando...'
          : usada
            ? 'Borrar registro de consumo'
            : 'Registrar sesión bonificada'}
      </button>
    </div>
  )
}
