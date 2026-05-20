'use client'

import { useState, useTransition, useRef } from 'react'
import { addPayment } from './actions'

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--gray-200)',
  background: 'var(--gray-100)',
  color: 'var(--gray-900)',
  fontFamily: 'var(--font-dm-sans)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--gray-500)',
  fontFamily: 'var(--font-dm-sans)',
}

interface PaymentFormProps {
  affiliateId: string
}

export default function PaymentForm({ affiliateId }: PaymentFormProps) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addPayment(affiliateId, formData)
      setMessage({ text: result.message, ok: result.success })
      if (result.success) {
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Amount + Currency row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="payment-amount"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={labelStyle}
          >
            Monto
          </label>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ ...inputStyle, colorScheme: 'light' }}
          />
        </div>

        <div>
          <label
            htmlFor="payment-currency"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={labelStyle}
          >
            Moneda
          </label>
          <select
            id="payment-currency"
            name="currency"
            defaultValue="ARS"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all cursor-pointer"
            style={inputStyle}
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label
          htmlFor="payment-method"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          Medio de pago
        </label>
        <select
          id="payment-method"
          name="payment_method"
          defaultValue="transferencia"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all cursor-pointer"
          style={inputStyle}
        >
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="mercado_pago">Mercado Pago</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label
          htmlFor="payment-status"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          Estado del pago
        </label>
        <select
          id="payment-status"
          name="status"
          defaultValue="approved"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all cursor-pointer"
          style={inputStyle}
        >
          <option value="approved">Aprobado</option>
          <option value="pending">Pendiente</option>
          <option value="rejected">Rechazado</option>
        </select>
      </div>

      {/* External ID */}
      <div>
        <label
          htmlFor="payment-external-id"
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={labelStyle}
        >
          ID externo <span style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'none', fontWeight: 400 }}>(MP, CBU, etc.)</span>
        </label>
        <input
          id="payment-external-id"
          name="external_id"
          type="text"
          placeholder="Opcional"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={inputStyle}
        />
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
        {isPending ? 'Registrando...' : 'Registrar pago'}
      </button>
    </form>
  )
}
