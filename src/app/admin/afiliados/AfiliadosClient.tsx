'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Affiliate, AffiliateStatus } from '@/lib/types'

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)' },
  pending:   { label: 'Pendiente',  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   border: 'rgba(202,138,4,0.2)' },
  suspended: { label: 'Suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.1)',   border: 'rgba(234,88,12,0.2)' },
  cancelled: { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)' },
}

type PeriodFilter = 'all' | 'week' | 'month' | 'year'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getStartOf(period: PeriodFilter): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  // week: Monday
  const day = now.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function exportCSV(list: Affiliate[]) {
  const headers = [
    'N° Afiliado', 'Nombre', 'Apellido', 'DNI', 'Email',
    'WhatsApp', 'Ciudad', 'Fecha nacimiento', 'Estado',
    'Cobertura desde', 'Cobertura hasta', 'Fecha registro',
  ]
  const rows = list.map((a) => [
    a.affiliate_number,
    a.nombre,
    a.apellido,
    a.dni,
    a.email,
    a.whatsapp ?? '',
    a.ciudad ?? '',
    a.fecha_nacimiento ?? '',
    STATUS_CONFIG[a.status]?.label ?? a.status,
    a.cobertura_desde ?? '',
    a.cobertura_hasta ?? '',
    a.created_at ? new Date(a.created_at).toLocaleDateString('es-AR') : '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `afiliados-nexo-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AfiliadosClient({ affiliates }: { affiliates: Affiliate[] }) {
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const start = getStartOf(period)
    return affiliates.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (start && new Date(a.created_at) < start) return false
      return true
    })
  }, [affiliates, period, statusFilter])

  const stats = [
    { label: 'Total',      value: filtered.length,                                                       accent: 'var(--purple)' },
    { label: 'Activos',    value: filtered.filter((a) => a.status === 'active').length,                   accent: '#16a34a' },
    { label: 'Pendientes', value: filtered.filter((a) => a.status === 'pending').length,                  accent: '#ca8a04' },
    { label: 'Inactivos',  value: filtered.filter((a) => a.status === 'suspended' || a.status === 'cancelled').length, accent: '#ea580c' },
  ]

  const PERIODS: { value: PeriodFilter; label: string }[] = [
    { value: 'all',   label: 'Todo' },
    { value: 'week',  label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'year',  label: 'Este año' },
  ]

  const STATUSES: { value: AffiliateStatus | 'all'; label: string }[] = [
    { value: 'all',       label: 'Todos los estados' },
    { value: 'active',    label: 'Activos' },
    { value: 'pending',   label: 'Pendientes' },
    { value: 'suspended', label: 'Suspendidos' },
    { value: 'cancelled', label: 'Cancelados' },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Panel de administración
          </p>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Afiliados
          </h1>
        </div>

        {/* Export button */}
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Period filter */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: period === p.value ? 'white' : 'transparent',
                color: period === p.value ? 'var(--purple)' : 'rgba(255,255,255,0.55)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AffiliateStatus | 'all')}
          className="px-3 py-2 rounded-xl text-xs font-semibold outline-none"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'var(--font-dm-sans)',
            cursor: 'pointer',
          }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} style={{ background: '#1a0a3c', color: 'white' }}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card px-5 py-5">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--gray-600)', fontFamily: 'var(--font-dm-sans)' }}>
              {s.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: s.accent, fontFamily: 'var(--font-dm-sans)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
            Listado de afiliados
            {period !== 'all' && (
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--gray-500)' }}>
                · {PERIODS.find(p => p.value === period)?.label}
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
                {['N° afiliado', 'Nombre completo', 'Email', 'WhatsApp', 'Estado', 'Cobertura hasta', 'Registro', ''].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--gray-500)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--gray-500)' }}>
                    No hay afiliados para el período seleccionado.
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                  className="hover:bg-black/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold" style={{ color: 'var(--purple)' }}>
                    {a.affiliate_number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: 'var(--gray-900)' }}>
                    {a.nombre} {a.apellido}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--gray-700)' }}>
                    {a.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--gray-700)' }}>
                    {a.whatsapp ?? '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{
                        color: STATUS_CONFIG[a.status]?.color,
                        background: STATUS_CONFIG[a.status]?.bg,
                        border: `1px solid ${STATUS_CONFIG[a.status]?.border}`,
                      }}
                    >
                      {STATUS_CONFIG[a.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--gray-700)' }}>
                    {formatDate(a.cobertura_hasta)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--gray-500)' }}>
                    {formatDate(a.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/afiliados/${a.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                      style={{
                        background: 'rgba(134,96,239,0.1)',
                        color: 'var(--purple)',
                        border: '1px solid rgba(134,96,239,0.2)',
                      }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
