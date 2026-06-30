'use client'

import { useState, useTransition } from 'react'
import { updateSeguroHogarStatus } from './actions'

const OPCIONES: { value: 'pendiente' | 'contactado' | 'dado_de_alta'; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'dado_de_alta', label: 'Dado de alta' },
]

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status)
  const [isPending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as 'pendiente' | 'contactado' | 'dado_de_alta'
    const prev = value
    setValue(next)
    startTransition(async () => {
      const res = await updateSeguroHogarStatus(id, next)
      if (!res.success) setValue(prev)
    })
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={isPending}
      className="px-2 py-1 rounded-md text-xs font-semibold"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
    >
      {OPCIONES.map((o) => (
        <option key={o.value} value={o.value} style={{ color: '#000' }}>{o.label}</option>
      ))}
    </select>
  )
}
