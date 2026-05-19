import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Affiliate, AffiliateStatus } from '@/lib/types'

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)' },
  pending:   { label: 'Pendiente',  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   border: 'rgba(202,138,4,0.2)' },
  suspended: { label: 'Suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.1)',   border: 'rgba(234,88,12,0.2)' },
  cancelled: { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)' },
}

function StatusBadge({ status }: { status: AffiliateStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AfiliadosPage() {
  const supabase = createAdminClient()

  const { data: affiliates, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar afiliados: {error.message}
      </div>
    )
  }

  const list = (affiliates ?? []) as Affiliate[]

  const total      = list.length
  const activos    = list.filter((a) => a.status === 'active').length
  const pendientes = list.filter((a) => a.status === 'pending').length
  const otros      = list.filter((a) => a.status === 'suspended' || a.status === 'cancelled').length

  const stats = [
    { label: 'Total afiliados',         value: total,      accent: 'var(--purple)' },
    { label: 'Activos',                  value: activos,    accent: '#16a34a' },
    { label: 'Pendientes',               value: pendientes, accent: '#ca8a04' },
    { label: 'Suspendidos / Cancelados', value: otros,      accent: '#ea580c' },
  ]

  return (
    <div className="flex flex-col gap-8">

      {/* Page title */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Panel de administración
        </p>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Afiliados
        </h1>
      </div>

      {/* Stats cards */}
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
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center" style={{ color: 'var(--gray-500)' }}>
                    No hay afiliados registrados.
                  </td>
                </tr>
              )}
              {list.map((a) => (
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
                    <StatusBadge status={a.status} />
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
