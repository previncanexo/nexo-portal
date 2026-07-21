import { createAdminClient } from '@/lib/supabase/admin'
import { parsePeriodParams } from '@/components/admin/PeriodFilter'
import PagosClient from './PagosClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Admin Nexo' }

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const sp = await searchParams
  const { from, to } = parsePeriodParams(sp)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const supabase = createAdminClient()

  // Filtrar por paid_at (para pagos aprobados) o created_at (para no aprobados)
  // Usamos or() para que ambos entren en el rango cuando corresponda.
  const { data } = await supabase
    .from('payments')
    .select(
      '*, affiliate:affiliates(id, nombre, apellido, affiliate_number, email, whatsapp, plan_id, mp_subscription_id)'
    )
    .or(`and(paid_at.gte.${fromIso},paid_at.lte.${toIso}),and(paid_at.is.null,created_at.gte.${fromIso},created_at.lte.${toIso})`)
    .order('created_at', { ascending: false })
    .limit(500)

  const { data: plansData } = await supabase.from('plans').select('id, name')
  const plansMap = new Map((plansData ?? []).map((p) => [p.id, p.name]))

  // Adjuntar plan_name al affiliate
  const payments = (data ?? []).map((p: Record<string, unknown>) => {
    const aff = p.affiliate as { plan_id?: string } | null
    if (aff && aff.plan_id) {
      return { ...p, affiliate: { ...aff, plan_name: plansMap.get(aff.plan_id) ?? null } }
    }
    return p
  })

  return <PagosClient payments={payments as never} />
}
