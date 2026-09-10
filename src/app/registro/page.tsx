import { createAdminClient } from '@/lib/supabase/admin'
import RegistroForm from './RegistroForm'

export const dynamic = 'force-dynamic'

export default async function RegistroPage() {
  const supabase = createAdminClient()
  const { data: plans } = await supabase
    .from('plans')
    // `slug` se agrega para poder resolver los beneficios reales de cada plan
    // (`planes-catalogo.ts`) en RegistroForm — antes este select no lo traía y el
    // form mostraba una lista fija de 4 beneficios sin mirar qué plan se eligió.
    .select('id, name, price, slug')
    // Solo los planes que se ofrecen hoy. El plan legacy sigue existiendo para los
    // afiliados que lo tienen, pero no se puede contratar.
    .eq('is_active', true)
    .order('price', { ascending: true })

  const planList = (plans ?? []).length > 0
    ? plans!
    : [{ id: '', name: 'Previnca Nexo', price: 19500, slug: null }]

  return <RegistroForm plans={planList} />
}
