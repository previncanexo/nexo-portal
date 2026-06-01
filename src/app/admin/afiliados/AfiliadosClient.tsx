'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Affiliate, AffiliateStatus, Plan } from '@/lib/types'
import { formatDateAR } from '@/lib/dateUtils'
import CreateAfiliadoModal from './CreateAfiliadoModal'
import { deleteAffiliate } from './[id]/actions'

const PAGE_SIZE = 25

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.12)',   border: 'rgba(22,163,74,0.25)' },
  pending:   { label: 'Pendiente',  color: '#b45309', bg: 'rgba(180,83,9,0.1)',    border: 'rgba(180,83,9,0.22)' },
  suspended: { label: 'Suspendido', color: '#c2410c', bg: 'rgba(194,65,12,0.1)',   border: 'rgba(194,65,12,0.22)' },
  cancelled: { label: 'Cancelado',  color: '#b91c1c', bg: 'rgba(185,28,28,0.1)',   border: 'rgba(185,28,28,0.22)' },
}

type PeriodFilter = 'all' | 'week' | 'month' | 'year'

function formatDate(iso: string | null): string {
  return formatDateAR(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getStartOf(period: PeriodFilter): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'year') return new Date(now.getFullYear(), 0, 1)
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
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

export default function AfiliadosClient({ affiliates, plans, initialStatus, limitReached }: { affiliates: Affiliate[]; plans: Plan[]; initialStatus?: string; limitReached?: boolean }) {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'all'>(
    (initialStatus as AffiliateStatus) ?? 'all'
  )
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Affiliate | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPendingDelete, startDeleteTransition] = useTransition()

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    startDeleteTransition(async () => {
      const result = await deleteAffiliate(deleteTarget.id)
      if (result && !result.success) {
        setDeleteError(result.message)
      } else {
        setDeleteTarget(null)
        setDeleteError(null)
        router.push('/admin/afiliados')
      }
    })
  }

  useEffect(() => { setPage(0) }, [search, statusFilter, planFilter, period])

  const filtered = useMemo(() => {
    const start = getStartOf(period)
    const q = search.trim().toLowerCase()
    return affiliates.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (planFilter !== 'all' && a.plan_id !== planFilter) return false
      if (start && new Date(a.created_at) < start) return false
      if (q) {
        const haystack = [a.nombre, a.apellido, a.dni, a.email, a.affiliate_number]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [affiliates, period, statusFilter, planFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = [
    { label: 'Total',      value: filtered.length,                                                                         accent: 'var(--purple)', accentBg: 'rgba(134,96,239,0.1)' },
    { label: 'Activos',    value: filtered.filter((a) => a.status === 'active').length,                                     accent: '#16a34a',       accentBg: 'rgba(22,163,74,0.08)' },
    { label: 'Pendientes', value: filtered.filter((a) => a.status === 'pending').length,                                    accent: '#b45309',       accentBg: 'rgba(180,83,9,0.08)' },
    { label: 'Inactivos',  value: filtered.filter((a) => a.status === 'suspended' || a.status === 'cancelled').length,      accent: '#b91c1c',       accentBg: 'rgba(185,28,28,0.08)' },
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

      {limitReached && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 text-sm"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Se muestran los últimos 1.000 afiliados. Para ver registros anteriores, usá los filtros o exportá el CSV.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.50)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Panel de administración
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Afiliados
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(to right, var(--purple), var(--pink))',
              color: 'white',
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(134,96,239,0.35)',
            }}
          >
            Nuevo afiliado
          </button>

          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
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
      </div>

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, apellido, DNI o email..."
        className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Period filter */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: period === p.value ? 'rgba(134,96,239,0.25)' : 'transparent',
                color: period === p.value ? 'white' : 'rgba(255,255,255,0.70)',
                border: period === p.value ? '1px solid rgba(134,96,239,0.50)' : '1px solid transparent',
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
          className="px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-dm-sans)',
            cursor: 'pointer',
          }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} style={{ background: '#0f1623', color: 'white' }}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Plan filter */}
        {plans.length > 0 && (
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
            }}
          >
            <option value="all" style={{ background: '#0f1623', color: 'white' }}>Todos los planes</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f1623', color: 'white' }}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card px-5 py-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--gray-700)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {s.label}
              </p>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: s.accent }}
              />
            </div>
            <p
              className="text-4xl font-bold"
              style={{ color: s.accent, fontFamily: 'var(--font-dm-sans)' }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Listado de afiliados
            {period !== 'all' && (
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--gray-500)' }}>
                · {PERIODS.find(p => p.value === period)?.label}
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)' }}>
                {['N° afiliado', 'Nombre completo', 'Email', 'WhatsApp', 'Plan', 'Estado', 'Cobertura hasta', 'Registro', ''].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--gray-700)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm"
                    style={{ color: 'var(--gray-500)' }}
                  >
                    No hay afiliados para el período seleccionado.
                  </td>
                </tr>
              )}
              {paged.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: i < paged.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                  className="hover:bg-black/[0.025] transition-colors"
                >
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-sm font-bold" style={{ color: 'var(--purple)' }}>
                    {a.affiliate_number}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--gray-900)' }}>
                    {a.nombre} {a.apellido}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-700)' }}>
                    {a.email}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-700)' }}>
                    {a.whatsapp ?? '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-700)' }}>
                    {a.plan_id ? (plans.find((p) => p.id === a.plan_id)?.name ?? '—') : '—'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className="inline-block text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
                      style={{
                        color: STATUS_CONFIG[a.status]?.color,
                        background: STATUS_CONFIG[a.status]?.bg,
                        border: `1px solid ${STATUS_CONFIG[a.status]?.border}`,
                      }}
                    >
                      {STATUS_CONFIG[a.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-700)' }}>
                    {formatDate(a.cobertura_hasta)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--gray-600)' }}>
                    {formatDate(a.created_at)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/afiliados/${a.id}`}
                        className="text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(134,96,239,0.1)',
                          color: 'var(--purple)',
                          border: '1px solid rgba(134,96,239,0.25)',
                        }}
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => { setDeleteTarget(a); setDeleteError(null) }}
                        className="text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(220,38,38,0.08)',
                          color: '#f87171',
                          border: '1px solid rgba(220,38,38,0.22)',
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateAfiliadoModal
          plans={plans}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => router.refresh()}
        />
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !isPendingDelete) setDeleteTarget(null) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#1a1025', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white">¿Eliminar afiliado?</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Vas a eliminar a <strong className="text-white">{deleteTarget.nombre} {deleteTarget.apellido}</strong> permanentemente. Esta acción cancela su suscripción en Mercado Pago y no se puede deshacer.
              </p>
            </div>
            {deleteError && (
              <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.12)', color: '#f87171' }}>
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPendingDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPendingDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: 'rgba(220,38,38,0.85)', color: 'white', cursor: 'pointer' }}
              >
                {isPendingDelete ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
