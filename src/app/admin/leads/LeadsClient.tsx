'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PeriodFilter from '@/components/admin/PeriodFilter'
import CustomDropdown from '@/components/admin/CustomDropdown'

export interface UnifiedLead {
  id: string
  tipo: 'lead' | 'affiliate'
  status: string
  estado: 'Incompleto' | 'Completo'
  estadoKey: 'incompleto' | 'completo'
  fecha: string
  para_quien: string | null
  nombre: string
  apellido: string
  email: string
  whatsapp: string | null
  dni: string | null
  fecha_nacimiento: string | null
  ciudad: string | null
  domicilio: string | null
  medio_pago: string | null
  mp_email: string | null
  plan_id: string | null
  plan_name: string | null
  affiliate_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  fbclid: string | null
  gclid: string | null
  referer: string | null
  landing_url: string | null
  fbp: string | null
  fbc: string | null
  ga_client_id: string | null
  client_user_agent: string | null
  client_ip: string | null
}

const PARA_QUIEN_LABEL: Record<string, string> = {
  para_mi: 'Para mí',
  otra_persona: 'Para otra persona',
}
const MEDIO_PAGO_LABEL: Record<string, string> = {
  tarjeta: 'Tarjeta',
  mp_balance: 'Saldo Mercado Pago',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtBirth(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function initials(nombre: string, apellido: string): string {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase()
}

function shortId(id: string): string {
  return id.slice(0, 8)
}

function exportCSV(list: UnifiedLead[]) {
  const headers = [
    'ID', 'Tipo', 'Estado', 'Fecha',
    'Para quién', 'Nombre', 'Apellido', 'Email', 'WhatsApp',
    'DNI', 'Fecha nacimiento', 'Ciudad', 'Domicilio',
    'Medio de pago', 'Email MP', 'Plan', 'Affiliate ID',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'referer', 'landing_url',
    'fbp', 'fbc', 'ga_client_id', 'client_ip', 'client_user_agent',
  ]
  const rows = list.map((l) => [
    l.id, l.tipo, l.estado, l.fecha ? new Date(l.fecha).toLocaleString('es-AR') : '',
    l.para_quien ? PARA_QUIEN_LABEL[l.para_quien] ?? l.para_quien : '',
    l.nombre, l.apellido, l.email, l.whatsapp ?? '',
    l.dni ?? '', l.fecha_nacimiento ?? '', l.ciudad ?? '', l.domicilio ?? '',
    l.medio_pago ? MEDIO_PAGO_LABEL[l.medio_pago] ?? l.medio_pago : '',
    l.mp_email ?? '', l.plan_name ?? '', l.affiliate_id ?? '',
    l.utm_source ?? '', l.utm_medium ?? '', l.utm_campaign ?? '', l.utm_term ?? '', l.utm_content ?? '',
    l.fbclid ?? '', l.gclid ?? '', l.referer ?? '', l.landing_url ?? '',
    l.fbp ?? '', l.fbc ?? '', l.ga_client_id ?? '', l.client_ip ?? '', l.client_user_agent ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-nexo-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function LeadsClient({ rows }: { rows: UnifiedLead[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [detail, setDetail] = useState<UnifiedLead | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter.length > 0 && !statusFilter.includes(r.estadoKey)) return false
      if (q) {
        const haystack = [r.nombre, r.apellido, r.dni ?? '', r.email, r.id].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [rows, search, statusFilter])

  const stats = {
    total: filtered.length,
    incompletos: filtered.filter((r) => r.estadoKey === 'incompleto').length,
    completos: filtered.filter((r) => r.estadoKey === 'completo').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="section-heading">
        <h1>Leads</h1>
        <p>Incompletos: abandonaron el onboarding. Completos: terminaron pero no pagaron.</p>
      </div>

      <PeriodFilter defaultPreset="6m" />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      {/* Filter block */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <div className="period-card" style={{ height: 48, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
              Filtro
            </span>
          </div>
          <input
            className="input-dark"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido, DNI o email..."
            style={{ flex: 1, height: '100%', minWidth: 0, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', height: 48 }}>
          <CustomDropdown
            multi
            placeholder="Todos los estados"
            options={[
              { value: 'incompleto', label: 'Incompletos' },
              { value: 'completo',   label: 'Completos' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string[])}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            className="btn-ghost-admin"
            style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
            onClick={() => exportCSV(filtered)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar ({filtered.length})
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Suma de incompletos y completos</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Incompletos</span>
          <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.incompletos}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Abandonaron el onboarding</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completos</span>
          <span className="stat-value" style={{ color: '#60a5fa' }}>{stats.completos}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Terminaron pero no pagaron</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-dark">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre completo</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Fecha de creación</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Sin leads para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={`${r.tipo}-${r.id}`} style={{ cursor: 'pointer' }} onClick={() => setDetail(r)}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a08af2', whiteSpace: 'nowrap' }}>
                      {shortId(r.id)}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                      {r.nombre} {r.apellido}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
                      {r.plan_name ?? '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={r.estadoKey === 'completo' ? 'chip chip-completo' : 'chip chip-incompleto'}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                      {fmtDate(r.fecha)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn-detail"
                        onClick={(e) => { e.stopPropagation(); setDetail(r) }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <LeadDetailModal lead={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function LeadDetailModal({ lead: l, onClose }: { lead: UnifiedLead; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const hasCampaña = l.utm_source || l.utm_medium || l.utm_campaign || l.utm_term || l.utm_content || l.fbclid || l.gclid || l.referer || l.landing_url
  const hasTecnica = l.fbp || l.fbc || l.ga_client_id || l.client_ip || l.client_user_agent

  return createPortal(
    <div
      className="portal-dark"
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ maxWidth: 960, width: '100%', maxHeight: '85vh', overflow: 'hidden', padding: 0, background: 'rgba(20,10,40,0.97)', borderRadius: 24, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', width: 34, height: 34, borderRadius: 9999, cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >×</button>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', maxHeight: '85vh' }}>
          {/* Aside */}
          <aside style={{ background: 'linear-gradient(160deg, rgba(134,96,239,0.20) 0%, rgba(238,92,208,0.10) 60%, rgba(20,10,40,0.4) 100%)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 700, boxShadow: '0 8px 32px rgba(134,96,239,0.45)' }}>
              {initials(l.nombre, l.apellido)}
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Lead</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>{l.nombre} {l.apellido}</h2>
              <p style={{ fontFamily: 'monospace', color: '#a08af2', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{shortId(l.id)}</p>
              <span className={l.estadoKey === 'completo' ? 'chip chip-completo' : 'chip chip-incompleto'}>{l.estado}</span>
            </div>
            <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Registro</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{fmtDate(l.fecha)}</p>
              {l.para_quien && (
                <>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Para quién</p>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{PARA_QUIEN_LABEL[l.para_quien] || l.para_quien}</p>
                </>
              )}
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Status interno</p>
              <p style={{ color: '#fff', fontSize: 13, fontFamily: 'monospace' }}>{l.status}</p>
              {l.affiliate_id && (
                <>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 14, marginBottom: 6 }}>Affiliate asociado</p>
                  <p style={{ color: '#a08af2', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{shortId(l.affiliate_id)}</p>
                </>
              )}
            </div>
          </aside>

          {/* Section */}
          <section style={{ padding: '28px 28px 24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <SectionTitle icon="user">Datos del onboarding</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                <Field label="Email" value={l.email} />
                <Field label="WhatsApp" value={l.whatsapp} />
                <Field label="DNI" value={l.dni} />
                <Field label="Fecha nacimiento" value={fmtBirth(l.fecha_nacimiento)} />
                <Field label="Ciudad" value={l.ciudad} />
                <Field label="Domicilio" value={l.domicilio} />
                <Field label="Plan seleccionado" value={l.plan_name} />
                <Field label="Medio de pago" value={l.medio_pago ? MEDIO_PAGO_LABEL[l.medio_pago] ?? l.medio_pago : null} />
                <Field label="Email MP (si aplica)" value={l.mp_email} />
              </div>
            </div>

            {hasCampaña && (
              <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <SectionTitle icon="chart">Trazabilidad de campaña</SectionTitle>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                    <Field label="Origen (utm_source)" value={l.utm_source} />
                    <Field label="Medio (utm_medium)" value={l.utm_medium} />
                    <Field label="Campaña (utm_campaign)" value={l.utm_campaign} />
                    <Field label="Término (utm_term)" value={l.utm_term} />
                    <Field label="Contenido (utm_content)" value={l.utm_content} />
                    <Field label="Facebook click ID (fbclid)" value={l.fbclid} />
                    <Field label="Google click ID (gclid)" value={l.gclid} />
                    <Field label="Referer" value={l.referer} />
                  </div>
                  {l.landing_url && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Landing URL</p>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{l.landing_url}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasTecnica && (
              <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <SectionTitle icon="monitor">Datos de huella digital</SectionTitle>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                    <Field label="IP cliente" value={l.client_ip} />
                    <Field label="GA client_id" value={l.ga_client_id} />
                    <Field label="Facebook fbp" value={l.fbp} />
                    <Field label="Facebook fbc" value={l.fbc} />
                  </div>
                  {l.client_user_agent && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>User Agent</p>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{l.client_user_agent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
              <button onClick={onClose} className="btn-ghost-admin">Cerrar</button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  )
}

function SectionTitle({ icon, children }: { icon: 'user' | 'card' | 'chart' | 'monitor'; children: React.ReactNode }) {
  const paths: Record<string, React.ReactNode> = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    card: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 12l3-3 4 4 5-5" /></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[icon]}
      </svg>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{children}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{label}</p>
      <p style={{ color: value ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: value ? 500 : 400, wordBreak: 'break-word' }}>
        {value || '—'}
      </p>
    </div>
  )
}
