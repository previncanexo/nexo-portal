import { createAdminClient } from '@/lib/supabase/admin'
import RegistroForm from './RegistroForm'

export default async function RegistroPage() {
  const supabase = createAdminClient()
  const { data: plan } = await supabase
    .from('plans')
    .select('name, price')
    .order('price', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <RegistroForm plan={plan ?? { name: 'Plan Base', price: 19500 }} />
}
