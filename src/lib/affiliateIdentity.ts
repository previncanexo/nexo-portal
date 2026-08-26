import type { createAdminClient } from '@/lib/supabase/admin'

/**
 * Estados en los que un afiliado "ocupa" su identidad (DNI / email):
 * los que llegaron a pagar. Un 'pending' NO reserva nada — pueden existir
 * N leads/afiliados pendientes con los mismos datos.
 * 'cancelled' tampoco reserva: quien se dio de baja puede reafiliarse.
 *
 * Espeja los índices únicos parciales de
 * supabase/migrations/20260826000001_unique_affiliate_only_when_paid.sql
 */
export const PAID_AFFILIATE_STATUSES = ['active', 'suspended'] as const

export type IdentityConflict = 'dni' | 'email' | null

/**
 * Devuelve qué dato ya pertenece a un afiliado pagado, o null si está libre.
 * Usar ANTES de insertar/activar para dar un error claro en vez de un 23505.
 */
export async function findPaidIdentityConflict(
  supabase: ReturnType<typeof createAdminClient>,
  { dni, email, excludeAffiliateId }: { dni?: string | null; email?: string | null; excludeAffiliateId?: string },
): Promise<IdentityConflict> {
  if (dni) {
    let q = supabase
      .from('affiliates')
      .select('id')
      .eq('dni', dni)
      .in('status', PAID_AFFILIATE_STATUSES as unknown as string[])
      .limit(1)
    if (excludeAffiliateId) q = q.neq('id', excludeAffiliateId)
    const { data } = await q
    if (data && data.length > 0) return 'dni'
  }

  if (email) {
    let q = supabase
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .in('status', PAID_AFFILIATE_STATUSES as unknown as string[])
      .limit(1)
    if (excludeAffiliateId) q = q.neq('id', excludeAffiliateId)
    const { data } = await q
    if (data && data.length > 0) return 'email'
  }

  return null
}
