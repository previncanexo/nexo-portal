import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { PRESTACIONES_POR_PLAN, ON_DEMAND, type PlanSlug } from '@/lib/planes-catalogo'

export const dynamic = 'force-dynamic'

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

/**
 * Precios públicos de los planes vigentes, más sus prestaciones y el catálogo
 * on-demand. Es la misma información que ya está publicada en la landing, por
 * eso no lleva auth.
 *
 * NO expone el UUID: el único identificador que cruza el límite hacia la landing
 * es el slug. Así la landing no depende de Supabase ni en build ni en runtime.
 *
 * El precio dejó de ser el único dato que cruza a la landing: ahora también
 * viajan las `prestaciones` de cada plan (mergeadas acá por slug desde
 * `planes-catalogo.ts`, que es la fuente única de verdad — Supabase sólo sabe
 * slug/nombre/precio, no qué incluye cada uno) y el catálogo `onDemand`, para que
 * el CI de la landing (`scripts/check-precios.mjs`) los pueda verificar contra su
 * propia copia en `data/planes.ts` y detectar si se desincronizan.
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

  // Merge aditivo: si Supabase tiene un slug que el catálogo todavía no conoce
  // (plan nuevo dado de alta en el admin pero sin matriz cargada todavía),
  // `prestaciones` sale vacío en vez de romper la respuesta — mejor un plan sin
  // prestaciones listadas que un 500 en un endpoint público sin auth.
  const planes = (data ?? []).map((plan) => ({
    ...plan,
    prestaciones: PRESTACIONES_POR_PLAN[plan.slug as PlanSlug] ?? [],
  }))

  return jsonWithCors({ planes, onDemand: ON_DEMAND }, { origin })
}
