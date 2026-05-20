import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Affiliate, AffiliateStatus, Payment, Plan } from '@/lib/types'
import StatusForm from './StatusForm'
import PaymentForm from './PaymentForm'
import EditAfiliadoForm from './EditAfiliadoForm'
import NotesForm from './NotesForm'

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Activo',     color: '#16a34a', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.2)' },
  pending:   { label: 'Pendiente',  color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',  border: 'rgba(202,138,4,0.2)' },
  suspended: { label: 'Suspendido', color: '#ea580c', bg: 'rgba(234,88,12,0.1)',  border: 'rgba(234,88,12,0.2)' },
  cancelled: { label: 'Cancelado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.2)' },
}

function StatusBadge({ status }: { status: AffiliateStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
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

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
        {value || '—'}
      </span>
    </div>
  )
}

export default async function AfiliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: affiliateData, error }, { data: paymentsData }, { data: plansData }] = await Promise.all([
    supabase
      .from('affiliates')
      .select('*, plan:plans(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('payments')
      .select('*')
      .eq('affiliate_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('plans')
      .select('*')
      .order('price'),
  ])

  if (error || !affiliateData) notFound()

  const affiliate = affiliateData as Affiliate
  const payments = (paymentsData ?? []) as Payment[]
  const plans = (plansData ?? []) as Plan[]

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>

      {/* Back link */}
      <div>
        <Link
          href="/admin/afiliados"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a afiliados
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {affiliate.nombre} {affiliate.apellido}
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            N° {affiliate.affiliate_number}
          </p>
        </div>
        <StatusBadge status={affiliate.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: personal data + plan */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Personal data */}
          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Datos personales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DataRow label="DNI"              value={affiliate.dni} />
              <DataRow label="Email"            value={affiliate.email} />
              <DataRow label="WhatsApp"         value={affiliate.whatsapp} />
              <DataRow label="Ciudad"           value={affiliate.ciudad} />
              <DataRow label="Fecha nacimiento" value={formatDate(affiliate.fecha_nacimiento)} />
              <DataRow label="Registro"         value={formatDate(affiliate.created_at)} />
            </div>
          </div>

          {/* Plan & coverage */}
          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Plan y cobertura
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DataRow label="Plan"            value={affiliate.plan?.name ?? affiliate.plan_id ?? null} />
              <DataRow label="Cobertura desde" value={formatDate(affiliate.cobertura_desde)} />
              <DataRow label="Cobertura hasta" value={formatDate(affiliate.cobertura_hasta)} />
            </div>
          </div>

          {/* Edit personal data */}
          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Editar datos
            </h2>
            <EditAfiliadoForm affiliate={affiliate} plans={plans} />
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <div className="glass-card px-6 py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
                Pagos ({payments.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      {['Fecha', 'Monto', 'Método', 'Estado', 'ID externo'].map((col) => (
                        <th
                          key={col}
                          className="pb-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap pr-4"
                          style={{ color: 'var(--gray-500)' }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td className="py-2 pr-4 whitespace-nowrap" style={{ color: 'var(--gray-700)' }}>
                          {formatDate(p.created_at)}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap font-semibold" style={{ color: 'var(--gray-900)' }}>
                          {p.currency} {p.amount.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>
                          {p.payment_method ?? '—'}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap" style={{ color: 'var(--gray-600)' }}>
                          {p.status}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--gray-500)' }}>
                          {p.external_id ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right column: change status + register payment */}
        <div className="flex flex-col gap-6">
          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Cambiar estado
            </h2>
            <StatusForm
              affiliateId={affiliate.id}
              currentStatus={affiliate.status}
              coberturaDesde={affiliate.cobertura_desde}
              coberturaHasta={affiliate.cobertura_hasta}
            />
          </div>

          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Registrar pago
            </h2>
            <PaymentForm affiliateId={affiliate.id} />
          </div>

          <div className="glass-card px-6 py-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--gray-700)' }}>
              Notas internas
            </h2>
            <NotesForm affiliateId={affiliate.id} initialNotes={affiliate.notes} />
          </div>
        </div>

      </div>
    </div>
  )
}
