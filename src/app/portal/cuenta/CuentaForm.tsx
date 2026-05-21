'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, notifyPasswordChanged } from './actions'
import type { Affiliate } from '@/lib/types'

const INPUT_BASE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '0.9rem',
  colorScheme: 'dark',
}

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: readOnly ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)' }}
      >
        {label}
        {readOnly && <span className="ml-2 normal-case tracking-normal font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>(no editable)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl outline-none transition-all"
        style={{
          ...INPUT_BASE,
          opacity: readOnly ? 0.5 : 1,
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={(e) => {
          if (!readOnly) {
            e.target.style.border = '1px solid rgba(134,96,239,0.7)'
            e.target.style.background = 'rgba(255,255,255,0.1)'
          }
        }}
        onBlur={(e) => {
          if (!readOnly) {
            e.target.style.border = '1px solid rgba(255,255,255,0.12)'
            e.target.style.background = 'rgba(255,255,255,0.07)'
          }
        }}
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      {children}
    </h2>
  )
}

function Alert({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className="text-sm px-4 py-3 rounded-xl"
      style={{
        background: ok ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${ok ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: ok ? '#4ade80' : '#fca5a5',
      }}
    >
      {text}
    </div>
  )
}

function PrimaryBtn({ disabled, children }: { disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full py-3 rounded-full font-bold text-sm transition-opacity mt-1"
      style={{
        background: disabled ? 'rgba(255,255,255,0.5)' : 'white',
        color: disabled ? 'rgba(134,96,239,0.6)' : 'var(--purple)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
        border: 'none',
      }}
    >
      {children}
    </button>
  )
}

const CARD: React.CSSProperties = {
  background: 'rgba(134,96,239,0.55)',
  border: '1px solid rgba(255,255,255,0.18)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
}

export default function CuentaForm({ affiliate }: { affiliate: Affiliate }) {
  // ── Profile section ──────────────────────────────────────────────────────
  const [whatsapp, setWhatsapp] = useState(affiliate.whatsapp ?? '')
  const [ciudad, setCiudad] = useState(affiliate.ciudad ?? '')
  const [fechaNac, setFechaNac] = useState(affiliate.fecha_nacimiento ?? '')
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [profilePending, startProfile] = useTransition()

  function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    startProfile(async () => {
      const result = await updateProfile(affiliate.id, {
        whatsapp,
        ciudad,
        fecha_nacimiento: fechaNac,
      })
      setProfileMsg(result.success
        ? { ok: true, text: 'Datos actualizados correctamente.' }
        : { ok: false, text: result.error ?? 'Error al guardar.' })
    })
  }

  // ── Password section ─────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg(null)

    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    if (newPwd.length < 6) {
      setPwdMsg({ ok: false, text: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }

    setPwdLoading(true)
    try {
      const supabase = createClient()

      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: affiliate.email,
        password: currentPwd,
      })
      if (signInError) {
        setPwdMsg({ ok: false, text: 'La contraseña actual es incorrecta.' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) {
        setPwdMsg({ ok: false, text: error.message })
        return
      }

      setPwdMsg({ ok: true, text: 'Contraseña actualizada correctamente.' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      notifyPasswordChanged(affiliate.nombre, affiliate.email).catch(() => {})
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Mis datos ──────────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-7" style={CARD}>
        <SectionTitle>Mis datos</SectionTitle>
        <form onSubmit={handleProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="nombre" label="Nombre" value={affiliate.nombre} readOnly />
            <Field id="apellido" label="Apellido" value={affiliate.apellido} readOnly />
          </div>
          <Field id="dni" label="DNI" value={affiliate.dni} readOnly />
          <Field id="email" label="Email" type="email" value={affiliate.email} readOnly />
          <Field
            id="whatsapp"
            label="WhatsApp"
            type="tel"
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="+54 9 11 1234-5678"
          />
          <Field
            id="ciudad"
            label="Ciudad"
            value={ciudad}
            onChange={setCiudad}
            placeholder="Buenos Aires"
          />
          <Field
            id="fecha_nacimiento"
            label="Fecha de nacimiento"
            type="date"
            value={fechaNac}
            onChange={setFechaNac}
          />

          {profileMsg && <Alert ok={profileMsg.ok} text={profileMsg.text} />}

          <PrimaryBtn disabled={profilePending}>
            {profilePending ? 'Guardando...' : 'Guardar datos'}
          </PrimaryBtn>
        </form>
      </div>

      {/* ── Cambiar contraseña ─────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-7" style={CARD}>
        <SectionTitle>Cambiar contraseña</SectionTitle>
        <form onSubmit={handlePassword} className="flex flex-col gap-4">
          <Field
            id="current-pwd"
            label="Contraseña actual"
            type="password"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="••••••••"
          />
          <Field
            id="new-pwd"
            label="Nueva contraseña"
            type="password"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="••••••••"
          />
          <Field
            id="confirm-pwd"
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="••••••••"
          />

          {pwdMsg && <Alert ok={pwdMsg.ok} text={pwdMsg.text} />}

          <PrimaryBtn disabled={pwdLoading}>
            {pwdLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </PrimaryBtn>
        </form>
      </div>

    </div>
  )
}
