'use client'

import { useState } from 'react'
import type { CreateAffiliatePayload, CreateAffiliateResponse, Plan } from '@/lib/types'

interface Props {
  plans: Plan[]
  onClose: () => void
  onCreated: () => void
}

type FormFields = {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp: string
  ciudad: string
  fecha_nacimiento: string
  plan_id: string
}

type SuccessData = CreateAffiliateResponse

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  fontFamily: 'var(--font-dm-sans)',
  outline: 'none',
}

const inputFocusStyle: React.CSSProperties = {
  border: '1px solid rgba(134,96,239,0.7)',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-sm font-medium"
        style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export default function CreateAfiliadoModal({ plans, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormFields>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    whatsapp: '',
    ciudad: '',
    fecha_nacimiento: '',
    plan_id: '',
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessData | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function getInputStyle(fieldName: string): React.CSSProperties {
    return focusedField === fieldName
      ? { ...inputStyle, ...inputFocusStyle }
      : inputStyle
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload: CreateAffiliatePayload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.trim(),
      email: form.email.trim(),
    }

    if (form.whatsapp.trim()) payload.whatsapp = form.whatsapp.trim()
    if (form.ciudad.trim()) payload.ciudad = form.ciudad.trim()
    if (form.fecha_nacimiento) payload.fecha_nacimiento = form.fecha_nacimiento
    if (form.plan_id.trim()) payload.plan_id = form.plan_id.trim()

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json: CreateAffiliateResponse | { error: string } = await res.json()

      if (!res.ok) {
        setError((json as { error: string }).error ?? 'Error inesperado')
        return
      }

      setSuccess(json as CreateAffiliateResponse)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-lg"
        style={{
          background: 'rgba(15,5,40,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(32px)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {success ? (
          /* Success view */
          <div className="flex flex-col gap-5">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Afiliado creado
              </p>
              <h2 className="text-2xl font-bold text-white">Credenciales generadas</h2>
            </div>

            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Compartí las siguientes credenciales con el afiliado. La contrasena es temporal y debera cambiarla en el primer ingreso.
            </p>

            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(134,96,239,0.1)', border: '1px solid rgba(134,96,239,0.25)' }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  N de afiliado
                </p>
                <p className="text-xl font-bold font-mono" style={{ color: 'var(--purple)' }}>
                  {success.affiliate_number}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Email
                </p>
                <p className="text-sm font-semibold text-white">{success.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Contrasena temporal
                </p>
                <p className="text-lg font-bold font-mono text-white">{success.temp_password}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'white', color: 'var(--purple)' }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Form view */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Administracion
              </p>
              <h2 className="text-2xl font-bold text-white">Nuevo afiliado</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre *">
                <input
                  type="text"
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('nombre')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Juan"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  style={getInputStyle('nombre')}
                />
              </Field>

              <Field label="Apellido *">
                <input
                  type="text"
                  name="apellido"
                  required
                  value={form.apellido}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('apellido')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Perez"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  style={getInputStyle('apellido')}
                />
              </Field>
            </div>

            <Field label="DNI *">
              <input
                type="text"
                name="dni"
                required
                value={form.dni}
                onChange={handleChange}
                onFocus={() => setFocusedField('dni')}
                onBlur={() => setFocusedField(null)}
                placeholder="12345678"
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                style={getInputStyle('dni')}
              />
            </Field>

            <Field label="Email *">
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="juan@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                style={getInputStyle('email')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="WhatsApp">
                <input
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('whatsapp')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+54 9 11 1234 5678"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  style={getInputStyle('whatsapp')}
                />
              </Field>

              <Field label="Ciudad">
                <input
                  type="text"
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('ciudad')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Buenos Aires"
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  style={getInputStyle('ciudad')}
                />
              </Field>
            </div>

            <Field label="Fecha de nacimiento">
              <input
                type="date"
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                onFocus={() => setFocusedField('fecha_nacimiento')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm"
                style={{
                  ...getInputStyle('fecha_nacimiento'),
                  colorScheme: 'dark',
                }}
              />
            </Field>

            {plans.length > 0 && (
              <Field label="Plan">
                <select
                  name="plan_id"
                  value={form.plan_id}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('plan_id')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm cursor-pointer"
                  style={getInputStyle('plan_id')}
                >
                  <option value="" style={{ background: '#0f1623' }}>Sin plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#0f1623' }}>
                      {p.name} — ${p.price.toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {error && (
              <p
                className="text-sm px-4 py-2.5 rounded-xl"
                style={{
                  color: '#f87171',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{
                  background: 'white',
                  color: 'var(--purple)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {loading ? 'Creando...' : 'Crear afiliado'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
