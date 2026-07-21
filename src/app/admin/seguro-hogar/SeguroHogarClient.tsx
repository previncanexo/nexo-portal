'use client'

import { useState, useMemo } from 'react'
import PeriodFilter from '@/components/admin/PeriodFilter'
import CustomDropdown from '@/components/admin/CustomDropdown'
import StatusSelect from './StatusSelect'

export interface SolicitudRow {
  id: string
  plan: string
  status: string
  clicked_at: string
  affiliate: {
    nombre: string | null
    apellido: string | null
    email: string | null
    whatsapp: string | null
  } | null
}

const PLAN_LABEL: Record<string, string> = {
  hasta_1er_piso: 'Hasta 1er piso',
  segundo_piso_plus: '2do piso +',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function SeguroHogarClient({ rows }: { rows: SolicitudRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [planFilter, setPlanFilter] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false
      if (planFilter.length > 0 && !planFilter.includes(r.plan)) return false
      if (q) {
        const hay = [r.affiliate?.nombre ?? '', r.affiliate?.apellido ?? '', r.affiliate?.email ?? ''].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, search, statusFilter, planFilter])

  const stats = {
    total: filtered.length,
    pendiente: filtered.filter((r) => r.status === 'pendiente').length,
    contactado: filtered.filter((r) => r.status === 'contactado').length,
    dado_de_alta: filtered.filter((r) => r.status === 'dado_de_alta').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="section-heading">
        <h1>Seguro de Hogar</h1>
        <p>Solicitudes de contratación (clic en &quot;Contratar&quot;) para seguimiento comercial.</p>
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
            placeholder="Buscar por nombre o email..."
            style={{ flex: 1, height: '100%', minWidth: 0, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', height: 48 }}>
          <CustomDropdown
            multi
            placeholder="Todos los estados"
            options={[
              { value: 'pendiente',    label: 'Pendiente' },
              { value: 'contactado',   label: 'Contactado' },
              { value: 'dado_de_alta', label: 'Dado de alta' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string[])}
            style={{ flex: 1, minWidth: 0 }}
          />
          <CustomDropdown
            multi
            placeholder="Todos los planes"
            options={[
              { value: 'hasta_1er_piso',    label: 'Hasta 1er piso' },
              { value: 'segundo_piso_plus', label: '2do piso +' },
            ]}
            value={planFilter}
            onChange={(v) => setPlanFilter(v as string[])}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            className="btn-ghost-admin"
            style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
            onClick={() => alert('Export CSV: implementar en próxima iteración')}
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Solicitudes en el periodo</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes</span>
          <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.pendiente}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Aún no contactadas</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Contactados</span>
          <span className="stat-value" style={{ color: '#a08af2' }}>{stats.contactado}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>En proceso comercial</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Dados de alta</span>
          <span className="stat-value" style={{ color: '#4ade80' }}>{stats.dado_de_alta}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Contrataron el seguro</span>
        </div>
      </div>

      {/* Tabla dark */}
      <div className="table-dark">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Plan</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Sin solicitudes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>{fmtDate(r.clicked_at)}</td>
                    <td style={{ whiteSpace: 'nowrap', color: '#fff' }}>{r.affiliate?.nombre ?? '—'} {r.affiliate?.apellido ?? ''}</td>
                    <td style={{ color: 'rgba(255,255,255,0.75)' }}>{r.affiliate?.email ?? '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{r.affiliate?.whatsapp ?? '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{PLAN_LABEL[r.plan] ?? r.plan}</td>
                    <td><StatusSelect id={r.id} status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
