import { createAdminClient } from '@/lib/supabase/admin'
import RegistroForm from './RegistroForm'

export default async function RegistroPage() {
  const supabase = createAdminClient()
  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, price')
    .order('price', { ascending: true })

  const planList = (plans ?? []).length > 0
    ? plans!
    : [{ id: '', name: 'Plan Base', price: 19500 }]

  return <RegistroForm plans={planList} />
}
