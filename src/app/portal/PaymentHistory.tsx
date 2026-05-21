import type { Payment } from '@/lib/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aprobado', color: '#4ade80' },
  pending:  { label: 'Pendiente', color: '#fbbf24' },
  rejected: { label: 'Rechazado', color: '#f87171' },
}

export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div
        className="glass-card px-5 py-6 text-center"
        style={{ color: 'var(--gray-500)' }}
      >
        <p className="text-sm sm:text-base">No hay pagos registrados aún.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {payments.map((p) => {
        const s = STATUS_LABEL[p.status] ?? { label: p.status, color: '#9ca3af' }
        return (
          <div
            key={p.id}
            className="glass-card px-4 py-3.5 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-sm sm:text-base font-semibold"
                style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {formatAmount(p.amount, p.currency)}
              </p>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--gray-500)' }}>
                {formatDate(p.created_at)}
                {p.payment_method && (
                  <span className="ml-2 capitalize">{p.payment_method.replace(/_/g, ' ')}</span>
                )}
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: s.color, background: `${s.color}20`, border: `1px solid ${s.color}40` }}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
