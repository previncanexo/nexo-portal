'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { formatDateAR } from '@/lib/dateUtils'
import PeriodFilter from '@/components/admin/PeriodFilter'
import CustomDropdown from '@/components/admin/CustomDropdown'

interface PaymentRow {
  id: string
  amount: number
  currency: string
  mp_status: string
  mp_payment_id: string | null
  paid_at: string | null
  created_at: string
  period_from: string | null
  period_to: string | null
  type: 'payment' | 'refund'
  affiliate: {
    id: string
    nombre: string
    apellido: string
    affiliate_number: string
    email?: string | null
    whatsapp?: string | null
    plan_id?: string | null
    plan_name?: string | null
    mp_subscription_id?: string | null
  } | null
}

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  approved:     { label: 'Aprobado',    className: 'chip chip-approved' },
  pending:      { label: 'Pendiente',   className: 'chip chip-pending' },
  rejected:     { label: 'Rechazado',   className: 'chip chip-rejected' },
  in_process:   { label: 'En proceso',  className: 'chip chip-pending' },
  cancelled:    { label: 'Cancelado',   className: 'chip chip-cancelled' },
  refunded:     { label: 'Reembolsado', className: 'chip chip-completo' },
  charged_back: { label: 'Contracargo', className: 'chip chip-rejected' },
}

function formatDate(iso: string | null): string {
  return formatDateAR(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function initials(nombre: string, apellido: string): string {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase()
}

export default function PagosClient({ payments }: { payments: PaymentRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [detail, setDetail] = useState<PaymentRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return payments.filter((p) => {
      if (statusFilter.length > 0 && !statusFilter.includes(p.mp_status)) return false
      if (q) {
        const haystack = [
          p.affiliate?.nombre ?? '',
          p.affiliate?.apellido ?? '',
          p.affiliate?.affiliate_number ?? '',
          p.mp_payment_id ?? '',
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [payments, search, statusFilter])

  const totalApproved = useMemo(
    () => filtered.filter((p) => p.mp_status === 'approved').reduce((s, p) => s + p.amount, 0),
    [filtered]
  )
  const countApproved = filtered.filter((p) => p.mp_status === 'approved').length

  function exportCSV() {
    const headers = ['Fecha', 'Afiliado', 'N° Afiliado', 'Monto', 'Moneda', 'Estado', 'ID MP']
    const rows = filtered.map((p) => [
      formatDate(p.paid_at ?? p.created_at),
      p.affiliate ? `${p.affiliate.nombre} ${p.affiliate.apellido}` : '—',
      p.affiliate?.affiliate_number ?? '—',
      p.amount.toFixed(2),
      p.currency,
      STATUS_CHIP[p.mp_status]?.label ?? p.mp_status,
      p.mp_payment_id ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagos-nexo-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="section-heading">
        <h1>Pagos</h1>
        <p>Historial de cobros de MercadoPago. Filtrá por periodo o estado para conciliar.</p>
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
            placeholder="Buscar por nombre o N° afiliado..."
            style={{ flex: 1, height: '100%', minWidth: 0, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', height: 48 }}>
          <CustomDropdown
            multi
            placeholder="Todos los estados"
            options={[
              { value: 'approved',     label: 'Aprobado' },
              { value: 'pending',      label: 'Pendiente' },
              { value: 'rejected',     label: 'Rechazado' },
              { value: 'in_process',   label: 'En proceso' },
              { value: 'cancelled',    label: 'Cancelado' },
              { value: 'refunded',     label: 'Reembolsado' },
              { value: 'charged_back', label: 'Contracargo' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string[])}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            className="btn-ghost-admin"
            style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
            onClick={exportCSV}
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

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12, marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Total filtrado</span>
          <span className="stat-value">{filtered.length}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Cantidad de pagos en el rango</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Aprobados</span>
          <span className="stat-value" style={{ color: '#4ade80' }}>{countApproved}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Pagos cobrados con éxito</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Recaudado (ARS)</span>
          <span className="stat-value" style={{ color: '#a08af2' }}>${totalApproved.toLocaleString('es-AR')}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Suma de pagos aprobados</span>
        </div>
      </div>

      {/* Tabla dark */}
      <div className="table-dark">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Afiliado</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>ID MP</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No hay pagos para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const chip = STATUS_CHIP[p.mp_status] ?? { label: p.mp_status, className: 'chip' }
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(p)}>
                    <td style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                      {formatDate(p.paid_at ?? p.created_at)}
                    </td>
                    <td>
                      {p.affiliate ? (
                        <>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
                            {p.affiliate.nombre} {p.affiliate.apellido}
                          </p>
                          <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#a08af2', margin: '2px 0 0 0' }}>
                            {p.affiliate.affiliate_number}
                          </p>
                        </>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                      {formatAmount(p.amount, p.currency)}
                    </td>
                    <td>
                      <span className={chip.className}>{chip.label}</span>
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)' }}>
                      {p.mp_payment_id ?? '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn-detail"
                        onClick={(e) => { e.stopPropagation(); setDetail(p) }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <PagoDetailModal pago={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function PagoDetailModal({ pago: p, onClose }: { pago: PaymentRow; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const chip = STATUS_CHIP[p.mp_status] ?? { label: p.mp_status, className: 'chip' }
  const af = p.affiliate

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ maxWidth: 960, width: '100%', maxHeight: '85vh', overflow: 'hidden', padding: 0, background: 'rgba(20,10,40,0.97)', borderRadius: 24, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', width: 34, height: 34, borderRadius: 9999, cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >×</button>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', maxHeight: '85vh' }}>
          {/* Aside pago */}
          <aside style={{ background: 'linear-gradient(160deg, rgba(134,96,239,0.22) 0%, rgba(238,92,208,0.10) 60%, rgba(20,10,40,0.4) 100%)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 32px rgba(134,96,239,0.45)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Pago</p>
              <p style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>{formatAmount(p.amount, p.currency)}</p>
              <p style={{ fontFamily: 'monospace', color: '#a08af2', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{p.id.slice(0, 8)}</p>
              <span className={chip.className}>{chip.label}</span>
            </div>
            <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Fecha del cobro</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{formatDateTime(p.created_at)}</p>
              <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Confirmado en MP</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{formatDateTime(p.paid_at)}</p>
              <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Tipo</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{p.type === 'refund' ? 'Reembolso' : 'Cobro'}</p>
            </div>
          </aside>

          {/* Section detalles */}
          <section style={{ padding: '28px 28px 24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Detalles del pago</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                <Field label="ID Mercado Pago" value={p.mp_payment_id} />
                <Field label="Suscripción MP" value={af?.mp_subscription_id ?? null} />
                <Field label="Moneda" value={p.currency} />
                <Field label="Estado interno" value={p.mp_status} />
                <Field label="Período desde" value={formatDate(p.period_from)} />
                <Field label="Período hasta" value={formatDate(p.period_to)} />
              </div>
            </div>

            {af && (
              <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Afiliado vinculado</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                      {initials(af.nombre, af.apellido)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{af.nombre} {af.apellido}</p>
                      <p style={{ fontFamily: 'monospace', color: '#a08af2', fontWeight: 700, fontSize: 12 }}>{af.affiliate_number}</p>
                    </div>
                    <Link href={`/admin/afiliados/${af.id}`} className="btn-detail" style={{ flexShrink: 0 }}>
                      Ver afiliado →
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                    <Field label="Plan contratado" value={af.plan_name ?? null} />
                    <Field label="Email" value={af.email ?? null} />
                    <Field label="WhatsApp" value={af.whatsapp ?? null} />
                    <Field label="ID interno" value={af.id.slice(0, 8)} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
              <button onClick={onClose} className="btn-ghost-admin">Cerrar</button>
            </div>
          </section>
        </div>
      </div>
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
