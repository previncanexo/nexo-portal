import type { Payment } from '@/lib/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: 'Aprobado', color: '#86efac', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)'  },
  pending:  { label: 'Pendiente', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)' },
  rejected: { label: 'Rechazado', color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)'  },
}

export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div
        className="glass-card px-5 py-6 text-center rounded-2xl"
        style={{ color: 'var(--gray-500)', fontFamily: 'var(--font-dm-sans)' }}
      >
        <p className="text-sm">No hay pagos registrados aún.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Table header */}
      <div
        className="px-4 py-3 flex justify-between items-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
      >
        <span
          className="text-xs uppercase tracking-[0.14em] font-semibold"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Monto
        </span>
        <div className="flex items-center gap-6">
          <span
            className="text-xs uppercase tracking-[0.14em] font-semibold hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Fecha
          </span>
          <span
            className="text-xs uppercase tracking-[0.14em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Estado
          </span>
        </div>
      </div>

      {/* Rows */}
      {payments.map((p, idx) => {
        const s = STATUS_LABEL[p.mp_status] ?? { label: p.mp_status, color: '#9ca3af', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.20)' }
        const isLast = idx === payments.length - 1
        return (
          <div
            key={p.id}
            className="px-4 py-3.5 flex justify-between items-center gap-3"
            style={isLast ? {} : { borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-white text-sm"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {formatAmount(p.amount, p.currency)}
              </p>
              {p.mp_payment_id && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
                  Mercado Pago
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
                {formatDate(p.created_at)}
              </span>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, fontFamily: 'var(--font-dm-sans)' }}
              >
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
