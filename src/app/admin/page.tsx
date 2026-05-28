import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import PendingApprovalSection from './PendingApprovalSection'

export const dynamic = 'force-dynamic'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MonthBucket {
  month: string // "YYYY-MM"
  label: string // "Ene 2025"
  count: number
}

interface RevenueBucket {
  month: string
  label: string
  total: number
}

interface RecentAffiliate {
  id: string
  nombre: string
  apellido: string
  status: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic',
}

function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year}`
}

/** Returns the last N month keys in "YYYY-MM" format, oldest first. */
function lastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  return months
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Activo',
    pending: 'Pendiente',
    suspended: 'Suspendido',
    cancelled: 'Cancelado',
  }
  return map[status] ?? status
}

function statusColor(status: string): CSSProperties {
  const map: Record<string, CSSProperties> = {
    active: { background: 'rgba(74,222,128,0.12)', color: 'rgb(74,222,128)', border: '1px solid rgba(74,222,128,0.25)' },
    pending: { background: 'rgba(251,191,36,0.12)', color: 'rgb(251,191,36)', border: '1px solid rgba(251,191,36,0.25)' },
    suspended: { background: 'rgba(248,113,113,0.12)', color: 'rgb(248,113,113)', border: '1px solid rgba(248,113,113,0.25)' },
    cancelled: { background: 'rgba(148,163,184,0.1)', color: 'rgba(148,163,184,0.8)', border: '1px solid rgba(148,163,184,0.2)' },
  }
  return map[status] ?? map.cancelled
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  delta,
  revenueDelta,
}: {
  label: string
  value: string | number
  delta?: { value: number; label: string }
  revenueDelta?: number
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <span className="text-xs uppercase tracking-[0.14em] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <span className="text-3xl font-bold text-white mt-1">{value}</span>
      {delta !== undefined && (
        <span
          className="text-xs font-medium"
          style={{ color: delta.value >= 0 ? '#86efac' : '#f87171' }}
        >
          {delta.value >= 0 ? '+' : ''}{delta.value} {delta.label}
        </span>
      )}
      {revenueDelta !== undefined && (
        <span
          className="text-xs font-medium"
          style={{ color: revenueDelta >= 0 ? '#86efac' : '#f87171' }}
        >
          {revenueDelta >= 0 ? '+' : ''}${revenueDelta.toLocaleString('es-AR')} vs mes anterior
        </span>
      )}
    </div>
  )
}

function BarChart({
  buckets,
  valueKey,
  formatValue,
}: {
  buckets: Array<{ label: string; [key: string]: number | string }>
  valueKey: string
  formatValue?: (v: number) => string
}) {
  const values = buckets.map((b) => Number(b[valueKey]))
  const maxVal = Math.max(...values, 1)

  return (
    <div className="flex flex-col gap-3">
      {buckets.map((b, i) => {
        const val = values[i]
        const pct = (val / maxVal) * 100
        return (
          <div key={b.label} className="flex items-center gap-3">
            <span
              className="text-xs w-16 shrink-0 text-right"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
            >
              {b.label}
            </span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, var(--purple), var(--pink))',
                  minWidth: val > 0 ? '4px' : '0',
                }}
              />
            </div>
            <span
              className="text-xs w-20 shrink-0 text-right"
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}
            >
              {formatValue ? formatValue(val) : val}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const monthKeys = lastNMonths(6)
  const sixMonthsAgo = `${monthKeys[0]}-01`

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().split('T')[0]
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    totalRes,
    activeRes,
    pendingRes,
    revenueMonthRes,
    affiliatesByMonthRes,
    revenueByMonthRes,
    recentRes,
    expiringRes,
  ] = await Promise.all([
    supabase.from('affiliates').select('id', { count: 'exact', head: true }),
    supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('affiliates')
      .select('id, nombre, apellido, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('payments').select('amount').eq('status', 'approved').gte('created_at', startOfMonth),
    supabase.from('affiliates').select('created_at').gte('created_at', sixMonthsAgo),
    supabase.from('payments').select('amount, created_at').eq('status', 'approved').gte('created_at', sixMonthsAgo),
    supabase
      .from('affiliates')
      .select('id, nombre, apellido, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('affiliates')
      .select('id, nombre, apellido, cobertura_hasta')
      .eq('status', 'active')
      .gte('cobertura_hasta', today)
      .lte('cobertura_hasta', in30Days)
      .order('cobertura_hasta', { ascending: true })
      .limit(5),
  ])

  // ── Stat totals ──────────────────────────────────────────────────────────
  const totalCount = totalRes.count ?? 0
  const activeCount = activeRes.count ?? 0
  const pendingAffiliates = (pendingRes.data ?? []) as Array<{ id: string; nombre: string; apellido: string; email: string; created_at: string }>
  const pendingCount = pendingAffiliates.length

  const thisMonthRevenue = (revenueMonthRes.data ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0
  )

  // ── Monthly buckets ──────────────────────────────────────────────────────
  const affiliateCountMap: Record<string, number> = {}
  for (const key of monthKeys) affiliateCountMap[key] = 0
  for (const row of affiliatesByMonthRes.data ?? []) {
    const key = row.created_at.slice(0, 7)
    if (key in affiliateCountMap) affiliateCountMap[key]++
  }

  const revenueSumMap: Record<string, number> = {}
  for (const key of monthKeys) revenueSumMap[key] = 0
  for (const row of revenueByMonthRes.data ?? []) {
    const key = row.created_at.slice(0, 7)
    if (key in revenueSumMap) revenueSumMap[key] += row.amount ?? 0
  }

  const affiliateBuckets: MonthBucket[] = monthKeys.map((key) => ({
    month: key,
    label: formatMonth(key),
    count: affiliateCountMap[key],
  }))

  const revenueBuckets: RevenueBucket[] = monthKeys.map((key) => ({
    month: key,
    label: formatMonth(key),
    total: Math.round(revenueSumMap[key]),
  }))

  // ── Recent affiliates ────────────────────────────────────────────────────
  const recentAffiliates: RecentAffiliate[] = (recentRes.data ?? []) as RecentAffiliate[]

  // ── Expiring coverage ────────────────────────────────────────────────────
  const expiringAffiliates = (expiringRes.data ?? []) as Array<{
    id: string
    nombre: string
    apellido: string
    cobertura_hasta: string
  }>

  // ── Month-over-month deltas ──────────────────────────────────────────────
  const thisMonthKey = monthKeys[5]
  const prevMonthKey = monthKeys[4]
  const newThisMonth = affiliateBuckets.find((b) => b.month === thisMonthKey)?.count ?? 0
  const newLastMonth = affiliateBuckets.find((b) => b.month === prevMonthKey)?.count ?? 0
  const revenueLastMonth = revenueBuckets.find((b) => b.month === prevMonthKey)?.total ?? 0

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10"
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      <PendingApprovalSection affiliates={pendingAffiliates} totalCount={pendingCount} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total afiliados" value={totalCount} />
        <StatCard label="Activos" value={activeCount} />
        <StatCard
          label="Nuevos este mes"
          value={newThisMonth}
          delta={{ value: newThisMonth - newLastMonth, label: 'vs mes anterior' }}
        />
        <StatCard
          label="Ingresos este mes"
          value={`$${thisMonthRevenue.toLocaleString('es-AR')}`}
          revenueDelta={thisMonthRevenue - revenueLastMonth}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {/* New affiliates chart */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <p className="text-xs uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>Nuevos afiliados</p>
          <p className="text-base font-bold text-white mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Últimos 6 meses</p>
          <BarChart
            buckets={affiliateBuckets.map((b) => ({ label: b.label, value: b.count }))}
            valueKey="value"
          />
        </div>

        {/* Monthly revenue chart */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <p className="text-xs uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>Ingresos mensuales</p>
          <p className="text-base font-bold text-white mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Últimos 6 meses</p>
          <BarChart
            buckets={revenueBuckets.map((b) => ({ label: b.label, value: b.total }))}
            valueKey="value"
            formatValue={(v) => `$${v.toLocaleString('es-AR')}`}
          />
        </div>
      </div>

      {/* Expiring coverage */}
      {expiringAffiliates.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-10"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(251,191,36)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-base font-semibold" style={{ color: 'rgb(251,191,36)' }}>
              Coberturas por vencer (próximos 30 días)
            </p>
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
            {expiringAffiliates.map((a) => (
              <a
                key={a.id}
                href={`/admin/afiliados/${a.id}`}
                className="flex items-center justify-between py-2.5 gap-4 hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-medium text-white">
                  {a.nombre} {a.apellido}
                </span>
                <span className="text-sm font-mono shrink-0" style={{ color: 'rgb(251,191,36)' }}>
                  {formatDate(a.cobertura_hasta)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent affiliates */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <p className="text-xs uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>Afiliados recientes</p>
        <p className="text-base font-bold text-white mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Últimos registros</p>

        {recentAffiliates.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No hay afiliados registrados.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {recentAffiliates.map((a) => (
              <Link
                key={a.id}
                href={`/admin/afiliados/${a.id}`}
                className="flex items-center justify-between py-3 gap-4 transition-colors hover:bg-white/[0.03] -mx-2 px-2 rounded-lg"
              >
                <span className="text-sm font-medium text-white">
                  {a.nombre} {a.apellido}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={statusColor(a.status)}
                  >
                    {statusLabel(a.status)}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {formatDate(a.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
