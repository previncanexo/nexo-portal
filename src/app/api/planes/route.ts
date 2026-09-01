import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

/**
 * Precios públicos de los planes vigentes. Es la misma información que ya está
 * publicada en la landing, por eso no lleva auth.
 *
 * NO expone el UUID: el único identificador que cruza el límite hacia la landing
 * es el slug. Así la landing no depende de Supabase ni en build ni en runtime.
 */
export async function GET(req: Request) {
  const origin = req.headers.get('origin')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plans')
    .select('slug, name, price')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('price', { ascending: false })

  if (error) {
    return jsonWithCors({ error: 'No se pudieron leer los planes' }, { status: 500, origin })
  }

  return jsonWithCors({ planes: data ?? [] }, { origin })
}
