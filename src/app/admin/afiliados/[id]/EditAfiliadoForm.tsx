'use client'

import { useState, useTransition, useRef } from 'react'
import { updateAffiliateData } from './actions'
import type { Affiliate, Plan } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.07)',
  color: 'white',
  fontFamily: 'var(--font-dm-sans)',
}

const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.65)',
  fontFamily: 'var(--font-dm-sans)',
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

interface Props {
  affiliate: Affiliate
  plans: Plan[]
}

export default function EditAfiliadoForm({ affiliate, plans }: Props) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateAffiliateData(affiliate.id, formData)
      setMessage({ text: result.message, ok: result.success })
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            Nombre *
          </label>
          <input
            name="nombre"
            type="text"
            required
            defaultValue={affiliate.nombre}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            Apellido *
          </label>
          <input
            name="apellido"
            type="text"
            required
            defaultValue={affiliate.apellido}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
          DNI *
        </label>
        <input
          name="dni"
          type="text"
          required
          defaultValue={affiliate.dni}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            WhatsApp
          </label>
          <input
            name="whatsapp"
            type="tel"
            defaultValue={affiliate.whatsapp ?? ''}
            placeholder="+54 9 11..."
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            Ciudad
          </label>
          <input
            name="ciudad"
            type="text"
            defaultValue={affiliate.ciudad ?? ''}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
          Fecha de nacimiento
        </label>
        <input
          name="fecha_nacimiento"
          type="date"
          defaultValue={toDateInputValue(affiliate.fecha_nacimiento)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
      </div>

      {plans.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            Plan
          </label>
          <select
            name="plan_id"
            defaultValue={affiliate.plan_id ?? ''}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
            style={inputStyle}
          >
            <option value="" style={{ background: '#0f1623' }}>Sin plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f1623' }}>
                {p.name} — ${p.price.toLocaleString('es-AR')}
              </option>
            ))}
          </select>
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
