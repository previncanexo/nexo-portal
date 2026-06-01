import { createAdminClient } from '@/lib/supabase/admin'
import type { Plan } from '@/lib/types'
import PlansClient from './PlansClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Planes · Admin Nexo' }

export default async function PlanesPage() {
  const supabase = createAdminClient()

  const [{ data: plansData }, { data: countsData }] = await Promise.all([
    supabase.from('plans').select('*').order('price'),
    supabase.from('affiliates').select('plan_id').not('plan_id', 'is', null).eq('status', 'active'),
  ])

  const plans = (plansData ?? []) as Plan[]

  const affiliateCounts: Record<string, number> = {}
  for (const row of countsData ?? []) {
    if (row.plan_id) {
      affiliateCounts[row.plan_id] = (affiliateCounts[row.plan_id] ?? 0) + 1
    }
  }

  return <PlansClient plans={plans} affiliateCounts={affiliateCounts} />
}
