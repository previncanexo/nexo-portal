import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leads — Admin Nexo' }

interface LeadRow {
  id: string
  para_quien: string
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  dni: string | null
  ciudad: string | null
  status: string
  affiliate_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    partial: { bg: 'rgba(251,191,36,0.18)', color: '#fbbf24', label: 'Parcial' },
    converted: { bg: 'rgba(74,222,128,0.18)', color: '#4ade80', label: 'Completo' },
    abandoned: { bg: 'rgba(248,113,113,0.18)', color: '#f87171', label: 'Abandonado' },
  }
  const v = map[status] ?? { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', label: status }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: v.bg, color: v.color }}
    >
      {v.label}
    </span>
  )
}

function paraQuienBadge(para_quien: string) {
  const isMe = para_quien === 'para_mi'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{
        background: isMe ? 'rgba(134,96,239,0.15)' : 'rgba(238,92,208,0.15)',
        color: isMe ? '#a08af2' : '#ee5cd0',
      }}
    >
      {isMe ? 'Para mí' : 'Para otra persona'}
    </span>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function LeadsPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar leads: {error.message}
      </div>
    )
  }

  const leads = (data ?? []) as LeadRow[]
  const stats = {
    total: leads.length,
    partial: leads.filter((l) => l.status === 'partial').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    abandoned: leads.filter((l) => l.status === 'abandoned').length,
  }

  return (
    <div className="px-4 sm:px-8 pt-24 pb-12 max-w-[1200px] mx-auto">
      {/* Header + stats */}
      <div className="mb-8">
        <h1
          className="mb-2"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            color: '#fff',
          }}
        >
          Leads
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}>
          Captura del onboarding antes de la conversión a afiliado.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#fff' },
          { label: 'Parciales', value: stats.partial, color: '#fbbf24' },
          { label: 'Completos', value: stats.converted, color: '#4ade80' },
          { label: 'Abandonados', value: stats.abandoned, color: '#f87171' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-1"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
            >
              {s.label}
            </p>
            <p
              className="text-2xl font-bold"
              style={{ color: s.color, fontFamily: 'var(--font-dm-sans)' }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)', color: '#fff' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {['Fecha', 'Para quién', 'Nombre', 'Email', 'WhatsApp', 'DNI', 'Ciudad', 'Estado', 'Afiliado'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Sin leads todavía.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {fmtDate(l.created_at)}
                    </td>
                    <td className="px-4 py-3">{paraQuienBadge(l.para_quien)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.nombre} {l.apellido}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {l.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {l.whatsapp}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {l.dni ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {l.ciudad ?? '—'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(l.status)}</td>
                    <td className="px-4 py-3">
                      {l.affiliate_id ? (
                        <Link
                          href={`/admin/afiliados/${l.affiliate_id}`}
                          style={{ color: '#a08af2', textDecoration: 'underline' }}
                        >
                          Ver
                        </Link>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                      )}
                    </td>
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
