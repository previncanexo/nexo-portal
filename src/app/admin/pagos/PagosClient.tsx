'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface PaymentRow {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  external_id: string | null
  created_at: string
  affiliate: {
    id: string
    nombre: string
    apellido: string
    affiliate_number: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: 'Aprobado',  color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.2)' },
  pending:  { label: 'Pendiente', color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',  border: 'rgba(202,138,4,0.2)' },
  rejected: { label: 'Rechazado', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.2)' },
}

const METHOD_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo:      'Efectivo',
  mercado_pago:  'Mercado Pago',
  otro:          'Otro',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getMonthKey(iso: string): string {
  return iso.slice(0, 7)
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[parseInt(m) - 1]} ${y}`
}

export default function PagosClient({ payments }: { payments: PaymentRow[] }) {
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const monthKeys = useMemo(() => {
    const keys = [...new Set(payments.map((p) => getMonthKey(p.created_at)))].sort().reverse()
    return keys
  }, [payments])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (monthFilter !== 'all' && getMonthKey(p.created_at) !== monthFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      return true
    })
  }, [payments, monthFilter, statusFilter])

  const totalApproved = useMemo(
    () => filtered.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
    [filtered]
  )

  const countApproved = filtered.filter((p) => p.status === 'approved').length

  function exportCSV() {
    const headers = ['Fecha', 'Afiliado', 'N° Afiliado', 'Monto', 'Moneda', 'Método', 'Estado', 'ID externo']
    const rows = filtered.map((p) => [
      formatDate(p.created_at),
      p.affiliate ? `${p.affiliate.nombre} ${p.affiliate.apellido}` : '—',
      p.affiliate?.affiliate_number ?? '—',
      p.amount.toFixed(2),
      p.currency,
      METHOD_LABELS[p.payment_method ?? ''] ?? p.payment_method ?? '—',
      STATUS_CONFIG[p.status]?.label ?? p.status,
      p.external_id ?? '',
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-dm-sans)' }}>
            Panel de administración
          </p>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Pagos
          </h1>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar ({filtered.length})
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-sm block mb-1" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>Total filtrado</span>
          <span className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{filtered.length}</span>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <span className="text-sm block mb-1" style={{ color: 'rgba(22,163,74,0.8)', fontFamily: 'var(--font-dm-sans)' }}>Aprobados</span>
          <span className="text-3xl font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-dm-sans)' }}>{countApproved}</span>
        </div>
        <div className="rounded-2xl p-5 col-span-2 sm:col-span-1" style={{ background: 'rgba(134,96,239,0.08)', border: '1px solid rgba(134,96,239,0.2)' }}>
          <span className="text-sm block mb-1" style={{ color: 'rgba(134,96,239,0.8)', fontFamily: 'var(--font-dm-sans)' }}>Recaudado (ARS)</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--purple)', fontFamily: 'var(--font-dm-sans)' }}>
            ${totalApproved.toLocaleString('es-AR')}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
        >
          <option value="all" style={{ background: '#0f1623' }}>Todos los meses</option>
          {monthKeys.map((k) => (
            <option key={k} value={k} style={{ background: '#0f1623' }}>
              {formatMonthLabel(k)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
        >
          <option value="all" style={{ background: '#0f1623' }}>Todos los estados</option>
          <option value="approved" style={{ background: '#0f1623' }}>Aprobados</option>
          <option value="pending" style={{ background: '#0f1623' }}>Pendientes</option>
          <option value="rejected" style={{ background: '#0f1623' }}>Rechazados</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
            Listado de pagos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)' }}>
                {['Fecha', 'Afiliado', 'Monto', 'Método', 'Estado', 'ID externo', ''].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--gray-700)' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--gray-500)' }}>
                    No hay pagos para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {filtered.map((p, i) => {
                const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                    className="hover:bg-black/[0.025] transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-700)' }}>
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.affiliate ? (
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
                            {p.affiliate.nombre} {p.affiliate.apellido}
                          </p>
                          <p className="text-xs font-mono" style={{ color: 'var(--purple)' }}>
                            {p.affiliate.affiliate_number}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--gray-500)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold" style={{ color: 'var(--gray-900)' }}>
                      {formatAmount(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-600)' }}>
                      {METHOD_LABELS[p.payment_method ?? ''] ?? p.payment_method ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className="inline-block text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono" style={{ color: 'var(--gray-500)' }}>
                      {p.external_id ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.affiliate && (
                        <Link
                          href={`/admin/afiliados/${p.affiliate.id}`}
                          className="text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all hover:opacity-80"
                          style={{ background: 'rgba(134,96,239,0.1)', color: 'var(--purple)', border: '1px solid rgba(134,96,239,0.25)' }}
                        >
                          Ver afiliado
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
