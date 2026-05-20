import { createAdminClient } from '@/lib/supabase/admin'
import type { Affiliate, Plan } from '@/lib/types'
import AfiliadosClient from './AfiliadosClient'

export default async function AfiliadosPage() {
  const supabase = createAdminClient()

  const [{ data, error }, { data: plansData }] = await Promise.all([
    supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
    supabase.from('plans').select('*').order('price'),
  ])

  if (error) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Error al cargar afiliados: {error.message}
      </div>
    )
  }

  return (
    <AfiliadosClient
      affiliates={(data ?? []) as Affiliate[]}
      plans={(plansData ?? []) as Plan[]}
    />
  )
}
