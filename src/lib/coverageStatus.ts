import type { createAdminClient } from '@/lib/supabase/admin'

/**
 * Normaliza `affiliate.status` cuando la cobertura efectivamente terminó.
 *
 * Diseño del sistema: al cancelar NO se marca `status='cancelled'` de una —
 * se setea `cancel_requested_at` y el afiliado conserva acceso hasta que
 * venza la cobertura ya paga (`cobertura_hasta`). Lo que faltaba era el
 * paso final: cuando esa fecha pasa, nadie lo movía a `cancelled` y el
 * afiliado quedaba "active" zombie para siempre, inconsistente con MP
 * (que ya no cobra), con el portal (que muestra activo pero sin credencial)
 * y con el admin (que lo lista como activo).
 *
 * Esta función corre inline al leer un affiliate (portal + admin) y hace
 * el UPDATE si corresponde. No depende de un cron — la próxima vez que
 * alguien mire el registro, se autoconsolida. Devuelve el status final
 * para que el caller no tenga que re-fetchear.
 */
export async function ensureCoberturaStatus(
  supabase: ReturnType<typeof createAdminClient>,
  affiliate: {
    id: string
    status: string
    cobertura_hasta: string | null
    cancel_requested_at: string | null
  },
): Promise<string> {
  if (affiliate.status !== 'active') return affiliate.status
  if (!affiliate.cancel_requested_at) return affiliate.status
  if (!affiliate.cobertura_hasta) return affiliate.status

  const hoy = new Date().toISOString().slice(0, 10)
  if (affiliate.cobertura_hasta >= hoy) return affiliate.status

  // Cobertura ya venció y había cancel pedido → consolidar como cancelled.
  const { error } = await supabase
    .from('affiliates')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', affiliate.id)
    .eq('status', 'active') // guard anti-race: si otro proceso ya lo movió, no pisar

  if (error) {
    console.error('[ensureCoberturaStatus] update error:', error.message)
    return affiliate.status
  }
  return 'cancelled'
}
