import { createAdminClient } from '@/lib/supabase/admin'
import RegistroForm from './RegistroForm'

export const dynamic = 'force-dynamic'

export default async function RegistroPage() {
  const supabase = createAdminClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, price')
    // Solo los planes que se ofrecen hoy. El plan legacy sigue existiendo para los
    // afiliados que lo tienen, pero no se puede contratar.
    .eq('is_active', true)
    .order('price', { ascending: true })

  const planList = (plans ?? []).length > 0
    ? plans!
    : [{ id: '', name: 'Previnca Nexo', price: 19500 }]

  return <RegistroForm plans={planList} />
}
