import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { parsePeriodParams } from '@/components/admin/PeriodFilter'
import SeguroHogarClient, { type SolicitudRow } from './SeguroHogarClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguro de Hogar — Admin Nexo' }

export default async function SeguroHogarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const sp = await searchParams
  const { from, to } = parsePeriodParams(sp)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seguro_hogar_solicitudes')
    .select('id, plan, status, clicked_at, affiliate:affiliates(nombre, apellido, email, whatsapp)')
    .gte('clicked_at', from.toISOString())
    .lte('clicked_at', to.toISOString())
    .order('clicked_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar solicitudes: {error.message}
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <SeguroHogarClient rows={(data ?? []) as unknown as SolicitudRow[]} />
    </Suspense>
  )
}
