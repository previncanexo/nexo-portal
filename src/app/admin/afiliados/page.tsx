import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Affiliate, Plan } from '@/lib/types'
import { parsePeriodParams } from '@/components/admin/PeriodFilter'
import AfiliadosClient from './AfiliadosClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Afiliados — Admin Nexo' }

export default async function AfiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; preset?: string }>
}) {
  const supabase = createAdminClient()
  const params = await searchParams
  const { from, to } = parsePeriodParams(params)

  const LIMIT = 1000
  const [{ data, error }, { data: plansData }] = await Promise.all([
    supabase
      .from('affiliates')
      .select('*')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false })
      .limit(LIMIT),
    supabase.from('plans').select('*').order('price'),
  ])
  const limitReached = (data?.length ?? 0) >= LIMIT

  if (error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar afiliados: {error.message}
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <AfiliadosClient
        affiliates={(data ?? []) as Affiliate[]}
        plans={(plansData ?? []) as Plan[]}
        initialStatus={params.status}
        limitReached={limitReached}
      />
    </Suspense>
  )
}
