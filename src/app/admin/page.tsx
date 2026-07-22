import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import PeriodFilter from '@/components/admin/PeriodFilter'
import { parsePeriodParams } from '@/components/admin/period-utils'
import BarLineChart from '@/components/admin/BarLineChart'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface Bucket { label: string; value: number }

/** Agrega registros con `created_at`/`paid_at` en buckets según el rango:
 *  - < 3 días → por hora del día actual
 *  - < 20 días → por día
 *  - < 100 días → por semana (lun–dom)
 *  - resto → por mes */
function bucketize(
  items: Array<{ date: string; amount?: number }>,
  from: Date,
  to: Date,
  aggregation: 'count' | 'sum' = 'count'
): Bucket[] {
  const rangeMs = to.getTime() - from.getTime()
  const days = rangeMs / (24 * 60 * 60 * 1000)

  type Granularity = 'hour' | 'day' | 'week' | 'month'
  const gran: Granularity =
    days < 3 ? 'hour' :
    days < 20 ? 'day' :
    days < 100 ? 'week' : 'month'

  function keyOf(d: Date): string {
    if (gran === 'hour') return `${d.getHours().toString().padStart(2, '0')}h`
    if (gran === 'day') return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    if (gran === 'week') {
      // Lunes de esa semana
      const day = d.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const mon = new Date(d)
      mon.setDate(d.getDate() + diff)
      return `${mon.getDate().toString().padStart(2, '0')}/${(mon.getMonth() + 1).toString().padStart(2, '0')}`
    }
    return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
  }

  // Generar labels vacíos en orden para todo el rango.
  const buckets: Record<string, number> = {}
  const order: string[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    const k = keyOf(cursor)
    if (!(k in buckets)) {
      buckets[k] = 0
      order.push(k)
    }
    if (gran === 'hour') cursor.setHours(cursor.getHours() + 1)
    else if (gran === 'day') cursor.setDate(cursor.getDate() + 1)
    else if (gran === 'week') cursor.setDate(cursor.getDate() + 7)
    else cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const item of items) {
    const d = new Date(item.date)
    if (d < from || d > to) continue
    const k = keyOf(d)
    if (!(k in buckets)) continue // fuera del grid generado
    buckets[k] += aggregation === 'sum' ? (item.amount ?? 0) : 1
  }

  return order.map((k) => ({ label: k, value: buckets[k] }))
}

function periodLabel(preset: string): string {
  const map: Record<string, string> = {
    '7d': 'Últimos 7 días',
    '15d': 'Últimos 15 días',
    '1m': 'Último mes',
    '6m': 'Últimos 6 meses',
    '1y': 'Último año',
    custom: '',
  }
  return map[preset] ?? preset
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const sp = await searchParams
  const { from, to, preset } = parsePeriodParams(sp)
  const supabase = createAdminClient()

  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  // Rango anterior (mismo tamaño, para deltas)
  const rangeMs = to.getTime() - from.getTime()
  const prevFromIso = new Date(from.getTime() - rangeMs).toISOString()
  const prevToIso = fromIso

  const [
    activeCountRes,
    inactiveCountRes,
    leadsCountRes,
    pendingAffiliatesRes,
    affiliatesByRangeRes,
    revenueByRangeRes,
    revenuePrevRangeRes,
    caidasByRangeRes,
    leadsByRangeRes,
  ] = await Promise.all([
    // Card: Afiliados (activos totales — no depende del rango)
    supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    // Card: Afiliados inactivos (suspended + cancelled totales)
    supabase.from('affiliates').select('id', { count: 'exact', head: true }).in('status', ['suspended', 'cancelled']),
    // Card: Leads (leads partial/abandoned + affiliates pending — no depende del rango)
    supabase.from('leads').select('id', { count: 'exact', head: true }).in('status', ['partial', 'abandoned']),
    supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    // Charts (todos filtrados por rango del periodo)
    supabase.from('affiliates').select('created_at, status').gte('created_at', fromIso).lte('created_at', toIso),
    supabase.from('payments').select('amount, paid_at').eq('mp_status', 'approved').gte('paid_at', fromIso).lte('paid_at', toIso),
    supabase.from('payments').select('amount, paid_at').eq('mp_status', 'approved').gte('paid_at', prevFromIso).lte('paid_at', prevToIso),
    supabase.from('affiliates').select('created_at, status').in('status', ['suspended', 'cancelled']).gte('created_at', fromIso).lte('created_at', toIso),
    supabase.from('leads').select('created_at').in('status', ['partial', 'abandoned']).gte('created_at', fromIso).lte('created_at', toIso),
  ])

  const activeCount = activeCountRes.count ?? 0
  const inactiveCount = inactiveCountRes.count ?? 0
  const leadsCount = (leadsCountRes.count ?? 0) + (pendingAffiliatesRes.count ?? 0)

  const currentRevenue = (revenueByRangeRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const prevRevenue = (revenuePrevRangeRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const revenueDelta = currentRevenue - prevRevenue

  // Charts
  const affiliatesActive = (affiliatesByRangeRes.data ?? []).filter((a) => a.status === 'active')
  const nuevosAfiliadosBuckets = bucketize(
    affiliatesActive.map((a) => ({ date: a.created_at })),
    from, to, 'count'
  )
  const ingresosBuckets = bucketize(
    (revenueByRangeRes.data ?? []).map((p) => ({ date: p.paid_at ?? '', amount: p.amount })),
    from, to, 'sum'
  )
  const caidasBuckets = bucketize(
    (caidasByRangeRes.data ?? []).map((c) => ({ date: c.created_at ?? '' })),
    from, to, 'count'
  )
  const leadsBuckets = bucketize(
    (leadsByRangeRes.data ?? []).map((l) => ({ date: l.created_at })),
    from, to, 'count'
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
      <div className="section-heading">
        <h1>Dashboard</h1>
        <p>Resumen general de afiliados, ingresos y leads del periodo seleccionado{periodLabel(preset) ? ` (${periodLabel(preset)})` : ''}.</p>
      </div>

      <Suspense fallback={<div style={{ height: 48 }} />}>
        <PeriodFilter defaultPreset="6m" />
      </Suspense>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        <div className="stat-card">
          <span className="stat-label">Afiliados</span>
          <span className="stat-value">{activeCount}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Activos</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ingresos del periodo</span>
          <span className="stat-value">${currentRevenue.toLocaleString('es-AR')}</span>
          <span className={`stat-delta ${revenueDelta >= 0 ? 'positive' : 'negative'}`}>
            {revenueDelta >= 0 ? '+' : ''}${revenueDelta.toLocaleString('es-AR')} vs periodo anterior
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Afiliados inactivos</span>
          <span className="stat-value">{inactiveCount}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
            Pagaron y luego se suspendieron o cancelaron
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Leads</span>
          <span className="stat-value">{leadsCount}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Incompletos + pendientes de pago</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 40 }}>
        <BarLineChart caption="Nuevos afiliados" data={nuevosAfiliadosBuckets} format="int" />
        <BarLineChart caption="Ingresos mensuales" data={ingresosBuckets} format="money" />
        <BarLineChart caption="Caídas" data={caidasBuckets} format="int" />
        <BarLineChart caption="Leads" data={leadsBuckets} format="int" />
      </div>
    </div>
  )
}
