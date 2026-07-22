import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { parsePeriodParams } from '@/components/admin/period-utils'
import LeadsClient, { type UnifiedLead } from './LeadsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Leads — Admin Nexo' }

/**
 * Vista unificada de leads:
 *   - Incompletos: filas en `leads` con status IN (partial, abandoned)
 *   - Completos:   filas en `affiliates` con status='pending'
 *
 * Los leads.status='converted' se excluyen porque su affiliate ya
 * aparece en la lista de Completos (evita duplicados).
 *
 * Ambos filtrados por rango del PeriodFilter (created_at).
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const sp = await searchParams
  const { from, to } = parsePeriodParams(sp)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const supabase = createAdminClient()

  // Query 1: leads incompletos con trazabilidad completa
  const incompletos = supabase
    .from('leads')
    .select(
      'id, status, para_quien, nombre, apellido, email, whatsapp, dni, fecha_nacimiento, ciudad, domicilio, medio_pago, mp_email, plan_id, affiliate_id, utm_source, utm_medium, utm_campaign, referer, fbp, fbc, ga_client_id, client_user_agent, client_ip, created_at'
    )
    .in('status', ['partial', 'abandoned'])
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false })
    .limit(500)

  // Query 2: affiliates pending (completos = terminaron onboarding, no pagaron)
  const completos = supabase
    .from('affiliates')
    .select('id, nombre, apellido, email, whatsapp, dni, fecha_nacimiento, ciudad, domicilio, plan_id, created_at')
    .eq('status', 'pending')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false })
    .limit(500)

  // Query 3: planes para mostrar nombre en lugar de plan_id
  const plansRes = supabase.from('plans').select('id, name').order('price')

  const [incRes, comRes, plansData] = await Promise.all([incompletos, completos, plansRes])

  if (incRes.error || comRes.error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar leads: {(incRes.error || comRes.error)?.message}
      </div>
    )
  }

  const plansMap = new Map((plansData.data ?? []).map((p) => [p.id, p.name]))

  const rows: UnifiedLead[] = [
    ...(incRes.data ?? []).map((l): UnifiedLead => ({
      id: l.id,
      tipo: 'lead',
      status: l.status,
      estado: 'Incompleto',
      estadoKey: 'incompleto',
      fecha: l.created_at,
      para_quien: l.para_quien,
      nombre: l.nombre,
      apellido: l.apellido,
      email: l.email,
      whatsapp: l.whatsapp,
      dni: l.dni,
      fecha_nacimiento: l.fecha_nacimiento,
      ciudad: l.ciudad,
      domicilio: l.domicilio,
      medio_pago: l.medio_pago,
      mp_email: l.mp_email,
      plan_id: l.plan_id,
      plan_name: l.plan_id ? plansMap.get(l.plan_id) ?? null : null,
      affiliate_id: l.affiliate_id,
      utm_source: l.utm_source,
      utm_medium: l.utm_medium,
      utm_campaign: l.utm_campaign,
      referer: l.referer,
      fbp: l.fbp,
      fbc: l.fbc,
      ga_client_id: l.ga_client_id,
      client_user_agent: l.client_user_agent,
      client_ip: l.client_ip,
    })),
    ...(comRes.data ?? []).map((a): UnifiedLead => ({
      id: a.id,
      tipo: 'affiliate',
      status: 'pending',
      estado: 'Completo',
      estadoKey: 'completo',
      fecha: a.created_at,
      para_quien: null,
      nombre: a.nombre,
      apellido: a.apellido,
      email: a.email,
      whatsapp: a.whatsapp,
      dni: a.dni,
      fecha_nacimiento: a.fecha_nacimiento,
      ciudad: a.ciudad,
      domicilio: a.domicilio,
      medio_pago: null,
      mp_email: null,
      plan_id: a.plan_id,
      plan_name: a.plan_id ? plansMap.get(a.plan_id) ?? null : null,
      affiliate_id: a.id,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referer: null,
      fbp: null,
      fbc: null,
      ga_client_id: null,
      client_user_agent: null,
      client_ip: null,
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  return (
    <Suspense fallback={null}>
      <LeadsClient rows={rows} />
    </Suspense>
  )
}
