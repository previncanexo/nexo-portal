import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leads — Admin Nexo' }

/**
 * Vista unificada de leads:
 *   - Incompletos: filas en `leads` con status IN (partial, abandoned)
 *     → gente que abrió el onboarding y NO terminó de cargar los datos.
 *   - Completos:   filas en `affiliates` con status='pending'
 *     → gente que terminó el onboarding pero NO completó el pago en MP.
 * Los `leads.status='converted'` se excluyen porque su affiliate ya
 * apareció en la lista de Completos (evita duplicados).
 */

interface UnifiedLead {
  id: string
  tipo: 'lead' | 'affiliate'
  fecha: string
  para_quien: string | null
  nombre: string
  apellido: string
  email: string
  whatsapp: string | null
  dni: string | null
  ciudad: string | null
  estado: 'Incompleto' | 'Completo'
  affiliate_id: string | null
}

function estadoBadge(estado: 'Incompleto' | 'Completo') {
  const isCompleto = estado === 'Completo'
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isCompleto ? 'rgba(74,222,128,0.18)' : 'rgba(251,191,36,0.18)',
        color:      isCompleto ? '#4ade80'               : '#fbbf24',
      }}
    >
      {estado}
    </span>
  )
}

function paraQuienBadge(para_quien: string | null) {
  if (!para_quien) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
  const isMe = para_quien === 'para_mi'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{
        background: isMe ? 'rgba(134,96,239,0.15)' : 'rgba(238,92,208,0.15)',
        color:      isMe ? '#a08af2'              : '#ee5cd0',
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

  // Query 1: leads incompletos (abandonaron el onboarding antes del final)
  const incompletos = supabase
    .from('leads')
    .select('id, para_quien, nombre, apellido, email, whatsapp, dni, ciudad, affiliate_id, created_at')
    .in('status', ['partial', 'abandoned'])
    .order('created_at', { ascending: false })
    .limit(500)

  // Query 2: affiliates pending = leads completos (terminaron onboarding, no pagaron)
  const completos = supabase
    .from('affiliates')
    .select('id, nombre, apellido, email, whatsapp, dni, ciudad, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(500)

  const [incRes, comRes] = await Promise.all([incompletos, completos])

  if (incRes.error || comRes.error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar leads: {(incRes.error || comRes.error)?.message}
      </div>
    )
  }

  const rows: UnifiedLead[] = [
    ...(incRes.data ?? []).map((l): UnifiedLead => ({
      id: l.id,
      tipo: 'lead',
      fecha: l.created_at,
      para_quien: l.para_quien,
      nombre: l.nombre,
      apellido: l.apellido,
      email: l.email,
      whatsapp: l.whatsapp,
      dni: l.dni,
      ciudad: l.ciudad,
      estado: 'Incompleto',
      affiliate_id: l.affiliate_id,
    })),
    ...(comRes.data ?? []).map((a): UnifiedLead => ({
      id: a.id,
      tipo: 'affiliate',
      fecha: a.created_at,
      para_quien: null,
      nombre: a.nombre,
      apellido: a.apellido,
      email: a.email,
      whatsapp: a.whatsapp,
      dni: a.dni,
      ciudad: a.ciudad,
      estado: 'Completo',
      affiliate_id: a.id,
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  const stats = {
    total: rows.length,
    incompletos: rows.filter((r) => r.estado === 'Incompleto').length,
    completos:   rows.filter((r) => r.estado === 'Completo').length,
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
          Incompletos: abandonaron el onboarding. Completos: terminaron pero no pagaron.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total',        value: stats.total,       color: '#fff' },
          { label: 'Incompletos',  value: stats.incompletos, color: '#fbbf24' },
          { label: 'Completos',    value: stats.completos,   color: '#4ade80' },
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
                {['Fecha', 'Estado', 'Para quién', 'Nombre', 'Email', 'WhatsApp', 'DNI', 'Ciudad', 'Ver'].map(
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
              {rows.length === 0 ? (
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
                rows.map((r) => (
                  <tr
                    key={`${r.tipo}-${r.id}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {fmtDate(r.fecha)}
                    </td>
                    <td className="px-4 py-3">{estadoBadge(r.estado)}</td>
                    <td className="px-4 py-3">{paraQuienBadge(r.para_quien)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.nombre} {r.apellido}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {r.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {r.whatsapp ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {r.dni ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {r.ciudad ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.affiliate_id ? (
                        <Link
                          href={`/admin/afiliados/${r.affiliate_id}`}
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
