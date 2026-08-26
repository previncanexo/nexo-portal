import type { createAdminClient } from '@/lib/supabase/admin'
import { findPaidIdentityConflict } from '@/lib/affiliateIdentity'

/**
 * Conversión lead → afiliado.
 *
 * El afiliado se materializa SOLO cuando MP confirma el pago. Antes de eso el
 * embudo entero vive en `leads` (status partial → completed), así que una
 * persona puede generar tantos intentos como quiera sin quedar bloqueada.
 *
 * El insert entra como status='pending' y el propio webhook lo pasa a 'active'
 * en el mismo request — la fila existe recién a partir del pago aprobado.
 */

export const AFFILIATE_SELECT =
  'id, status, user_id, nombre, apellido, dni, email, whatsapp, ciudad, affiliate_number, fecha_nacimiento, domicilio, plan:plans(name, price), purchase_event_sent_at'

export interface MaterializeOptions {
  mpSubscriptionId?: string | null
  mpPayerId?: string | number | null
}

/**
 * Crea el afiliado a partir de un lead completado y marca el lead como
 * 'converted'. Idempotente: si el lead ya tiene affiliate_id devuelve ese.
 * Devuelve null si el id no es un lead, si le faltan datos, o si el DNI/email
 * ya pertenece a un afiliado pagado.
 */
export async function materializeAffiliateFromLead(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  opts: MaterializeOptions = {},
) {
  const { data: lead } = await supabase
    .from('leads')
    .select('id, status, affiliate_id, nombre, apellido, email, whatsapp, dni, fecha_nacimiento, ciudad, domicilio, plan_id, checkout_url, mp_subscription_id')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) return null

  // Ya convertido: devolvemos el afiliado existente (re-entrega del webhook).
  if (lead.affiliate_id) {
    const { data: existing } = await supabase
      .from('affiliates')
      .select(AFFILIATE_SELECT)
      .eq('id', lead.affiliate_id)
      .maybeSingle()
    return existing ?? null
  }

  if (!lead.dni) {
    console.error('[lead→afiliado] lead sin DNI, no se puede afiliar', { leadId })
    return null
  }

  const dup = await findPaidIdentityConflict(supabase, { dni: lead.dni, email: lead.email })
  if (dup) {
    console.error(`[lead→afiliado] bloqueado: ya existe un afiliado pagado con el mismo ${dup}`, {
      leadId, dni: lead.dni, email: lead.email,
    })
    return null
  }

  // Claim atómico sobre el lead: dos entregas concurrentes del webhook no pueden
  // crear dos afiliados para el mismo lead. Solo gana el UPDATE que ve el lead
  // todavía sin convertir.
  const { data: claimed } = await supabase
    .from('leads')
    .update({ status: 'converted' })
    .eq('id', leadId)
    .neq('status', 'converted')
    .select('id')
    .maybeSingle()

  if (!claimed) {
    // Otra entrega ganó el claim: devolvemos el afiliado que haya creado.
    const { data: raced } = await supabase
      .from('leads')
      .select('affiliate_id')
      .eq('id', leadId)
      .maybeSingle()
    if (!raced?.affiliate_id) {
      console.warn('[lead→afiliado] claim perdido y sin affiliate_id todavía', { leadId })
      return null
    }
    const { data: existing } = await supabase
      .from('affiliates')
      .select(AFFILIATE_SELECT)
      .eq('id', raced.affiliate_id)
      .maybeSingle()
    return existing ?? null
  }

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .insert({
      nombre: lead.nombre,
      apellido: lead.apellido,
      dni: lead.dni,
      email: lead.email,
      whatsapp: lead.whatsapp,
      ciudad: lead.ciudad,
      domicilio: lead.domicilio,
      fecha_nacimiento: lead.fecha_nacimiento,
      plan_id: lead.plan_id,
      user_id: null,
      status: 'pending',
      checkout_url: lead.checkout_url,
      mp_subscription_id: opts.mpSubscriptionId ?? lead.mp_subscription_id ?? null,
      ...(opts.mpPayerId ? { mp_payer_id: opts.mpPayerId } : {}),
    })
    .select(AFFILIATE_SELECT)
    .single()

  if (error || !affiliate) {
    console.error('[lead→afiliado] insert error', { leadId, message: error?.message })
    // Soltamos el claim para que el reintento de MP lo vuelva a tomar.
    await supabase.from('leads').update({ status: 'completed' }).eq('id', leadId)
    return null
  }

  const { error: leadErr } = await supabase
    .from('leads')
    .update({ affiliate_id: affiliate.id })
    .eq('id', leadId)
  if (leadErr) {
    console.error('[lead→afiliado] no se pudo vincular el lead al afiliado', { leadId, affiliateId: affiliate.id, message: leadErr.message })
  }

  return affiliate
}

/**
 * El `external_reference` de MP puede ser un affiliate (subs legacy, creadas
 * cuando el afiliado nacía antes del pago) o un lead (flujo actual).
 * Devuelve siempre el id del affiliate, materializándolo si hace falta.
 */
export async function resolveAffiliateIdFromReference(
  supabase: ReturnType<typeof createAdminClient>,
  reference: string,
  opts: MaterializeOptions = {},
): Promise<string | null> {
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('id', reference)
    .maybeSingle()
  if (affiliate) return affiliate.id

  const materialized = await materializeAffiliateFromLead(supabase, reference, opts)
  return materialized?.id ?? null
}

/**
 * Fallback para subs sin external_reference utilizable: busca el último lead
 * que terminó el formulario y coincide por DNI o email del pagador.
 */
export async function findCompletedLeadId(
  supabase: ReturnType<typeof createAdminClient>,
  { dni, email, mpSubscriptionId }: { dni?: string | null; email?: string | null; mpSubscriptionId?: string | null },
): Promise<string | null> {
  if (mpSubscriptionId) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('mp_subscription_id', mpSubscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data.id
  }

  const pendingStatuses = ['completed', 'partial', 'abandoned']

  if (dni) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('dni', dni)
      .in('status', pendingStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data.id
  }

  if (email) {
    // El pagador puede haber usado la cuenta MP declarada en el onboarding
    // (mp_email) en vez del email principal — probamos los dos.
    for (const column of ['email', 'mp_email'] as const) {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq(column, email)
        .in('status', pendingStatuses)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) return data.id
    }
  }

  return null
}
