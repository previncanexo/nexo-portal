import { createAdminClient } from '@/lib/supabase/admin'
import StatusSelect from './StatusSelect'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguro de Hogar — Admin Nexo' }

interface SolicitudRow {
  id: string
  plan: string
  status: string
  clicked_at: string
  affiliate: { nombre: string | null; apellido: string | null; email: string | null; whatsapp: string | null } | null
}

const PLAN_LABEL: Record<string, string> = {
  hasta_1er_piso: 'Hasta 1er piso',
  segundo_piso_plus: '2do piso +',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function SeguroHogarPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('seguro_hogar_solicitudes')
    .select('id, plan, status, clicked_at, affiliate:affiliates(nombre, apellido, email, whatsapp)')
    .order('clicked_at', { ascending: false })
    .limit(500)

  if (error) {
    return <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>Error al cargar solicitudes: {error.message}</div>
  }

  const rows = (data ?? []) as unknown as SolicitudRow[]
  const stats = {
    total: rows.length,
    pendiente: rows.filter((r) => r.status === 'pendiente').length,
    contactado: rows.filter((r) => r.status === 'contactado').length,
    dado_de_alta: rows.filter((r) => r.status === 'dado_de_alta').length,
  }

  return (
    <div className="px-4 sm:px-8 pt-24 pb-12 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#fff' }}>
          Seguro de Hogar
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}>
          Solicitudes de contratación (clic en &quot;Contratar&quot;) para seguimiento comercial.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#fff' },
          { label: 'Pendientes', value: stats.pendiente, color: '#fbbf24' },
          { label: 'Contactados', value: stats.contactado, color: '#a08af2' },
          { label: 'Dados de alta', value: stats.dado_de_alta, color: '#4ade80' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-dm-sans)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)', color: '#fff' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Fecha', 'Nombre', 'Email', 'WhatsApp', 'Plan', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Sin solicitudes todavía.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{fmtDate(r.clicked_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.affiliate?.nombre ?? '—'} {r.affiliate?.apellido ?? ''}</td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.affiliate?.email ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.affiliate?.whatsapp ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.6)' }}>{PLAN_LABEL[r.plan] ?? r.plan}</td>
                    <td className="px-4 py-3"><StatusSelect id={r.id} status={r.status} /></td>
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
