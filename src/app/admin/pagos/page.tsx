import { createAdminClient } from '@/lib/supabase/admin'
import PagosClient from './PagosClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Admin Nexo' }

export default async function PagosPage() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('payments')
    .select('*, affiliate:affiliates(id, nombre, apellido, affiliate_number)')
    .order('created_at', { ascending: false })

  return <PagosClient payments={(data ?? []) as any} />
}
