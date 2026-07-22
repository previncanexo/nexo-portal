'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Affiliate, AffiliateStatus, Plan } from '@/lib/types'
import { formatDateAR } from '@/lib/dateUtils'
import CustomDropdown from '@/components/admin/CustomDropdown'
import PeriodFilter from '@/components/admin/PeriodFilter'
import CreateAfiliadoModal from './CreateAfiliadoModal'
import { deleteAffiliate } from './[id]/actions'

const PAGE_SIZE = 25

const STATUS_CHIP: Record<AffiliateStatus, { label: string; className: string }> = {
  active:    { label: 'Activo',     className: 'chip chip-active' },
  pending:   { label: 'Pendiente',  className: 'chip chip-pending' },
  suspended: { label: 'Suspendido', className: 'chip chip-suspended' },
  cancelled: { label: 'Cancelado',  className: 'chip chip-cancelled' },
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

function initials(nombre: string, apellido: string): string {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase()
}

function exportCSV(list: Affiliate[]) {
  const headers = [
    'N° Afiliado', 'Nombre', 'Apellido', 'DNI', 'Email',
    'WhatsApp', 'Ciudad', 'Fecha nacimiento', 'Estado',
    'Cobertura desde', 'Cobertura hasta', 'Fecha registro',
  ]
  const rows = list.map((a) => [
    a.affiliate_number, a.nombre, a.apellido, a.dni, a.email,
    a.whatsapp ?? '', a.ciudad ?? '', a.fecha_nacimiento ?? '',
    STATUS_CHIP[a.status]?.label ?? a.status,
    a.cobertura_desde ?? '', a.cobertura_hasta ?? '',
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

interface Traz {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referer: string | null
  fbp: string | null
  fbc: string | null
  ga_client_id: string | null
  client_user_agent: string | null
  client_ip: string | null
}

export default function AfiliadosClient({
  affiliates,
  plans,
  trazMap,
  initialStatus,
  limitReached,
}: {
  affiliates: Affiliate[]
  plans: Plan[]
  trazMap: Record<string, Traz>
  initialStatus?: string
  limitReached?: boolean
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus[]>(
    initialStatus && initialStatus !== 'all' ? [initialStatus as AffiliateStatus] : ['active']
  )
  const [planFilter, setPlanFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(0)
  const [detailAffiliate, setDetailAffiliate] = useState<Affiliate | null>(null)
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

  useEffect(() => { setPage(0) }, [search, statusFilter, planFilter])

  // Solo mostramos estados que pagaron: active, suspended, cancelled
  const affiliatesPaid = useMemo(
    () => affiliates.filter((a) => a.status !== 'pending'),
    [affiliates]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return affiliatesPaid.filter((a) => {
      if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false
      if (planFilter.length > 0 && (!a.plan_id || !planFilter.includes(a.plan_id))) return false
      if (q) {
        const haystack = [a.nombre, a.apellido, a.dni, a.email, a.affiliate_number].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [affiliatesPaid, statusFilter, planFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = {
    total:      filtered.length,
    activos:    filtered.filter((a) => a.status === 'active').length,
    suspendidos: filtered.filter((a) => a.status === 'suspended').length,
    cancelados:  filtered.filter((a) => a.status === 'cancelled').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      {/* Header con acciones */}
      <div className="section-heading" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Afiliados</h1>
          <p>Personas que completaron el pago y forman parte del plan. Filtrá por estado, plan o periodo.</p>
        </div>
        <button className="btn-primary-admin" style={{ padding: '12px 20px' }} onClick={() => setShowCreateModal(true)}>
          Nuevo afiliado
        </button>
      </div>

      {limitReached && (
        <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
          Se muestran los últimos 1.000 afiliados del rango. Ajustá el periodo para ver más registros.
        </div>
      )}

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
            placeholder="Estado"
            options={[
              { value: 'active',    label: 'Activos' },
              { value: 'suspended', label: 'Suspendidos' },
              { value: 'cancelled', label: 'Cancelados' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as AffiliateStatus[])}
            style={{ flex: 1, minWidth: 0 }}
          />
          <CustomDropdown
            multi
            placeholder="Todos los planes"
            options={plans.map((p) => ({ value: p.id, label: p.name }))}
            value={planFilter}
            onChange={(v) => setPlanFilter(v as string[])}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Suma de activos, suspendidos y cancelados</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Activos</span>
          <span className="stat-value" style={{ color: '#4ade80' }}>{stats.activos}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Con cobertura vigente</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Suspendidos</span>
          <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.suspendidos}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Pagaron y luego se dieron de baja temporal</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cancelados</span>
          <span className="stat-value" style={{ color: '#f87171' }}>{stats.cancelados}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Cancelaron la suscripción</span>
        </div>
      </div>

      {/* Tabla dark */}
      <div className="table-dark">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Nombre completo</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Fecha de creación</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No hay afiliados para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {paged.map((a) => (
                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailAffiliate(a)}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a08af2', whiteSpace: 'nowrap' }}>
                    {a.affiliate_number}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                    {a.nombre} {a.apellido}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
                    {a.plan_id ? (plans.find((p) => p.id === a.plan_id)?.name ?? '—') : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={STATUS_CHIP[a.status]?.className ?? 'chip'}>
                      {STATUS_CHIP[a.status]?.label ?? a.status}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(a.created_at)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn-detail"
                      onClick={(e) => { e.stopPropagation(); setDetailAffiliate(a) }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingTop: 20 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost-admin"
              style={{ padding: '8px 16px', opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-ghost-admin"
              style={{ padding: '8px 16px', opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal Nuevo afiliado */}
      {showCreateModal && (
        <CreateAfiliadoModal
          plans={plans}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => router.refresh()}
        />
      )}

      {/* Modal Detalle */}
      {detailAffiliate && (
        <DetailModal
          affiliate={detailAffiliate}
          plans={plans}
          traz={trazMap[detailAffiliate.id] ?? null}
          onClose={() => setDetailAffiliate(null)}
          onDelete={() => { setDeleteTarget(detailAffiliate); setDetailAffiliate(null) }}
        />
      )}

      {/* Modal Eliminar */}
      {deleteTarget && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !isPendingDelete) setDeleteTarget(null) }}
        >
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#1a1025', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>¿Eliminar afiliado?</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                Vas a eliminar a <strong style={{ color: '#fff' }}>{deleteTarget.nombre} {deleteTarget.apellido}</strong> permanentemente. Esta acción cancela su suscripción en Mercado Pago y no se puede deshacer.
              </p>
            </div>
            {deleteError && (
              <p style={{ fontSize: 12, fontWeight: 500, padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.12)', color: '#f87171' }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isPendingDelete}
                className="btn-ghost-admin"
                style={{ flex: 1, justifyContent: 'center', opacity: isPendingDelete ? 0.4 : 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPendingDelete}
                style={{ flex: 1, padding: 10, borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', cursor: 'pointer', opacity: isPendingDelete ? 0.6 : 1 }}
              >
                {isPendingDelete ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── DetailModal ─────────────────────────────────────────────────────────────

function DetailModal({
  affiliate: a,
  plans,
  traz,
  onClose,
  onDelete,
}: {
  affiliate: Affiliate
  plans: Plan[]
  traz: Traz | null
  onClose: () => void
  onDelete: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const chip = STATUS_CHIP[a.status] ?? { label: a.status, className: 'chip' }
  const planName = a.plan_id ? plans.find((p) => p.id === a.plan_id)?.name ?? '—' : '—'

  return createPortal(
    <div
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
          {/* Aside identidad */}
          <aside style={{ background: 'linear-gradient(160deg, rgba(134,96,239,0.20) 0%, rgba(238,92,208,0.10) 60%, rgba(20,10,40,0.4) 100%)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--purple), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 700, boxShadow: '0 8px 32px rgba(134,96,239,0.45)' }}>
              {initials(a.nombre, a.apellido)}
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Afiliado</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>{a.nombre} {a.apellido}</h2>
              <p style={{ fontFamily: 'monospace', color: '#a08af2', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{a.affiliate_number}</p>
              <span className={chip.className}>{chip.label}</span>
            </div>
            <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Plan contratado</p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{planName}</p>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Cobertura</p>
              <p style={{ color: '#fff', fontSize: 13 }}>{formatDate(a.cobertura_desde)} → {formatDate(a.cobertura_hasta)}</p>
            </div>
            {a.notes && (
              <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>Notas del admin</p>
                <p style={{ color: 'rgba(255,255,255,0.90)', fontSize: 13, lineHeight: 1.5, background: 'rgba(134,96,239,0.10)', border: '1px solid rgba(134,96,239,0.22)', borderLeft: '3px solid var(--purple)', borderRadius: 10, padding: '10px 12px' }}>
                  {a.notes}
                </p>
              </div>
            )}
          </aside>

          {/* Section detalles */}
          <section style={{ padding: '28px 28px 24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Datos personales</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                <Field label="Email" value={a.email} />
                <Field label="WhatsApp" value={a.whatsapp} />
                <Field label="DNI" value={a.dni} />
                <Field label="Fecha nacimiento" value={a.fecha_nacimiento ? formatDate(a.fecha_nacimiento) : null} />
                <Field label="Ciudad" value={a.ciudad} />
                <Field label="Domicilio" value={a.domicilio} />
                <Field label="Fecha de creación" value={formatDateTime(a.created_at)} />
                {a.mp_subscription_id && <Field label="Suscripción MP" value={a.mp_subscription_id} />}
              </div>
            </div>

            {traz && (traz.utm_source || traz.utm_campaign || traz.referer) && (
              <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" /><path d="M7 12l3-3 4 4 5-5" />
                  </svg>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Trazabilidad de campaña</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                  <Field label="Origen (utm_source)" value={traz.utm_source} />
                  <Field label="Medio (utm_medium)" value={traz.utm_medium} />
                  <Field label="Campaña (utm_campaign)" value={traz.utm_campaign} />
                  <Field label="Referer" value={traz.referer} />
                </div>
              </div>
            )}

            {traz && (traz.fbp || traz.fbc || traz.ga_client_id || traz.client_ip || traz.client_user_agent) && (
              <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Trazabilidad técnica</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                    <Field label="IP cliente" value={traz.client_ip} />
                    <Field label="GA client_id" value={traz.ga_client_id} />
                    <Field label="Facebook fbp" value={traz.fbp} />
                    <Field label="Facebook fbc" value={traz.fbc} />
                  </div>
                  {traz.client_user_agent && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>User Agent</p>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{traz.client_user_agent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 20, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'auto' }}>
              <button onClick={onDelete} className="btn-ghost-admin" style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.30)', color: '#f87171' }}>
                Eliminar
              </button>
              <button onClick={onClose} className="btn-ghost-admin">Cerrar</button>
              <Link href={`/admin/afiliados/${a.id}`} className="btn-primary-admin" style={{ padding: '10px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Ver ficha completa →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
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
