'use client'

import { useState, useTransition, useRef } from 'react'
import type { Plan } from '@/lib/types'
import { createPlan, updatePlan, deletePlan } from './actions'

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--gray-200)',
  background: 'var(--gray-100)',
  color: 'var(--gray-900)',
  fontFamily: 'var(--font-dm-sans)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--gray-500)',
  fontFamily: 'var(--font-dm-sans)',
}

function PlanForm({
  plan,
  onCancel,
  onDone,
}: {
  plan?: Plan
  onCancel?: () => void
  onDone?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = plan
        ? await updatePlan(plan.id, formData)
        : await createPlan(formData)
      setMessage({ text: result.message, ok: result.success })
      if (result.success) {
        formRef.current?.reset()
        onDone?.()
      }
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
            name="name"
            type="text"
            required
            defaultValue={plan?.name ?? ''}
            placeholder="Plan Base"
            className="w-full px-4 py-2.5 rounded-xl text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
            Precio (ARS) *
          </label>
          <input
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={plan?.price ?? ''}
            placeholder="19500"
            className="w-full px-4 py-2.5 rounded-xl text-sm"
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={labelStyle}>
          Descripción
        </label>
        <input
          name="description"
          type="text"
          defaultValue={plan?.description ?? ''}
          placeholder="Opcional"
          className="w-full px-4 py-2.5 rounded-xl text-sm"
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity"
          style={{
            background: isPending ? 'rgba(134,96,239,0.5)' : 'var(--purple)',
            color: 'white',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {isPending ? 'Guardando...' : plan ? 'Guardar cambios' : 'Crear plan'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-70"
            style={{
              background: 'var(--gray-100)',
              color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function PlanRow({ plan, affiliateCount }: { plan: Plan; affiliateCount: number }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deletePlan(plan.id)
      if (!result.success) setDeleteError(result.message)
    })
  }

  if (editing) {
    return (
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <PlanForm plan={plan} onCancel={() => setEditing(false)} onDone={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div
      className="px-6 py-4 flex items-center gap-4 flex-wrap"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
          {plan.name}
        </p>
        {plan.description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
            {plan.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0 flex-wrap">
        <span className="text-base font-bold" style={{ color: 'var(--purple)', fontFamily: 'var(--font-dm-sans)' }}>
          ${plan.price.toLocaleString('es-AR')}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(134,96,239,0.08)', color: 'var(--purple)', border: '1px solid rgba(134,96,239,0.15)' }}>
          {affiliateCount} afiliado{affiliateCount !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
          style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
        >
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending || affiliateCount > 0}
          title={affiliateCount > 0 ? 'No se puede eliminar: tiene afiliados asignados' : 'Eliminar plan'}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
        >
          {isPending ? '...' : 'Eliminar'}
        </button>
      </div>

      {deleteError && (
        <p className="w-full text-xs mt-1" style={{ color: '#dc2626' }}>{deleteError}</p>
      )}
    </div>
  )
}

export default function PlansClient({
  plans,
  affiliateCounts,
}: {
  plans: Plan[]
  affiliateCounts: Record<string, number>
}) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-dm-sans)' }}>
            Panel de administración
          </p>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Planes
          </h1>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: showCreate ? 'rgba(255,255,255,0.12)' : 'linear-gradient(to right, var(--purple), var(--pink))',
            border: showCreate ? '1px solid rgba(255,255,255,0.20)' : 'none',
            color: 'white',
            fontFamily: 'var(--font-dm-sans)',
            cursor: 'pointer',
            boxShadow: showCreate ? 'none' : '0 4px 16px rgba(134,96,239,0.35)',
          }}
        >
          {showCreate ? 'Cancelar' : '+ Nuevo plan'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-card px-6 py-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
            Nuevo plan
          </h2>
          <PlanForm onDone={() => setShowCreate(false)} />
        </div>
      )}

      {/* Plans list */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
            {plans.length} plan{plans.length !== 1 ? 'es' : ''} configurado{plans.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {plans.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: 'var(--gray-500)' }}>
            No hay planes configurados. Creá el primero.
          </div>
        ) : (
          plans.map((p) => (
            <PlanRow key={p.id} plan={p} affiliateCount={affiliateCounts[p.id] ?? 0} />
          ))
        )}
      </div>
    </div>
  )
}
