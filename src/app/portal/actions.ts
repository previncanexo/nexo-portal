'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago'
import { puedeCambiarA } from '@/lib/cambio-de-plan'
import type { PlanSlug } from '@/lib/planes-catalogo'
import { sendInternalPlanChangeFailedEmail } from '@/lib/emails'

type RetryResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string }

export async function retryPayment(): Promise<RetryResult> {
  if (!process.env.MP_ACCESS_TOKEN) {
    return { success: false, error: 'El sistema de pagos no está configurado.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, email, status, mp_subscription_id, plan:plans(id, name, price)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) return { success: false, error: 'Afiliado no encontrado.' }
  if (affiliate.status !== 'pending') {
    return { success: false, error: 'La cuenta no está en estado pendiente.' }
  }

  const rawPlan = affiliate.plan as any
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan

  const headersList = await headers()
  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  const host = headersList.get('host') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${host}`

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

  try {
    const planClient = new PreApprovalPlan(mpClient)
    const mpPlan = await planClient.create({
      body: {
        reason: plan?.name ?? 'Previnca Nexo',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/registro/exito`,
        external_reference: affiliate.id,
      } as any,
    })

    if (!mpPlan.init_point) {
      throw new Error('MP no devolvió URL de pago')
    }

    if (mpPlan.id) {
      await admin
        .from('affiliates')
        .update({ mp_subscription_id: String(mpPlan.id) })
        .eq('id', affiliate.id)
    }

    return { success: true, checkoutUrl: mpPlan.init_point }
  } catch (err: any) {
    const msg = err?.message ?? err?.cause?.message ?? JSON.stringify(err)
    console.error('[retry-payment]', msg, err)
    return { success: false, error: `Error MP: ${msg}` }
  }
}

// Registro best-effort del interés en Psicología On Demand.
// No debe interrumpir la redirección: si falla, solo loguea.
export async function registerPsicologiaClick(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    await admin.from('psicologia_clicks').insert({
      affiliate_id: affiliate?.id ?? null,
    })
  } catch (err) {
    console.error('[psicologia-click]', err)
  }
}

// Registro best-effort de la solicitud de Seguro de Hogar. No interrumpe la redirección.
export async function registerSeguroHogarSolicitud(
  plan: 'hasta_1er_piso' | 'segundo_piso_plus',
): Promise<void> {
  try {
    if (plan !== 'hasta_1er_piso' && plan !== 'segundo_piso_plus') return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    await admin.from('seguro_hogar_solicitudes').insert({
      affiliate_id: affiliate?.id ?? null,
      plan,
    })
  } catch (err) {
    console.error('[seguro-hogar-solicitud]', err)
  }
}

// Registro del interés en Árbol de Vida (Cochería Caramuto).
// Mientras el producto está en "Próximamente" este es el único evento del flujo
// (no hay redirección todavía), así que devuelve si se pudo registrar para que la
// UI no confirme un aviso que nunca quedó guardado.
// Se deduplica por afiliado: la lista de espera no gana nada con la misma persona repetida.
export async function registerArbolVidaSolicitud(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (affiliate?.id) {
      const { data: existente } = await admin
        .from('arbol_vida_solicitudes')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .limit(1)
        .maybeSingle()
      if (existente) return true
    }

    const { error } = await admin.from('arbol_vida_solicitudes').insert({
      affiliate_id: affiliate?.id ?? null,
    })
    if (error) throw error
    return true
  } catch (err) {
    console.error('[arbol-vida-solicitud]', err)
    return false
  }
}

export interface ResultadoCambioPlan {
  ok: boolean
  /** Texto listo para mostrarle al afiliado tal cual, en español rioplatense. */
  mensaje: string
}

/**
 * Pide el cambio a `planDestinoId` para el afiliado logueado.
 *
 * Decisión de producto (no se reabre acá, ver cabecera de la migración
 * `20260910000001_create_plan_changes.sql` y el módulo `cambio-de-plan.ts`):
 * esto NUNCA toca `affiliates.plan_id`. Sólo registra la intención, actualiza
 * el MONTO de la suscripción de Mercado Pago, y deja el cambio en `pendiente`
 * para que el webhook lo aplique cuando el próximo pago se acredite.
 */
export async function cambiarPlan(planDestinoId: string): Promise<ResultadoCambioPlan> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, mensaje: 'No autenticado.' }

  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, plan_id, fecha_nacimiento, status, cancel_requested_at, mp_subscription_id, plan:plans(name)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) return { ok: false, mensaje: 'Afiliado no encontrado.' }

  const rawPlanActual = affiliate.plan as any
  const planActual = Array.isArray(rawPlanActual) ? rawPlanActual[0] : rawPlanActual

  const { data: planDestino } = await admin
    .from('plans')
    .select('id, slug, name, price, is_active')
    .eq('id', planDestinoId)
    .maybeSingle()

  if (!planDestino) return { ok: false, mensaje: 'El plan seleccionado no existe.' }

  const { data: cambioPendienteExistente } = await admin
    .from('plan_changes')
    .select('id')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'pendiente')
    .maybeSingle()

  // `planDestino.slug` viene de la base tipado como `string | null`; se castea
  // a `PlanSlug` porque `puedeCambiarA` valida en runtime con `esSlugConocido`
  // (ver el comentario de esa función en `cambio-de-plan.ts`) y bloquea si no
  // reconoce el valor — el cast acá no relaja esa validación, sólo evita
  // duplicar el chequeo de tipos en dos lugares.
  const evaluacion = puedeCambiarA({
    planDestinoId: planDestino.id,
    planDestinoSlug: planDestino.slug as PlanSlug,
    planDestinoActivo: planDestino.is_active,
    planActualId: affiliate.plan_id,
    fecha_nacimiento: affiliate.fecha_nacimiento,
    status: affiliate.status,
    cancel_requested_at: affiliate.cancel_requested_at,
    tieneCambioPendiente: !!cambioPendienteExistente,
  })

  if (!evaluacion.permitido) {
    return { ok: false, mensaje: evaluacion.mensaje ?? 'No se puede procesar el cambio de plan.' }
  }

  // Guard de INTEGRACIÓN, no de negocio — por eso vive acá y no en
  // `cambio-de-plan.ts` (que es sólo funciones puras sin acceso a Supabase ni
  // a MP). `puedeCambiarA` puede autorizar el cambio perfectamente (edad,
  // plan activo, sin cambio pendiente, etc.) y aun así no haber ninguna
  // suscripción de Mercado Pago sobre la cual actualizar el monto — por
  // ejemplo un afiliado legacy sin `mp_subscription_id` cargado. Es un dato de
  // estado de la integración de pagos, no una regla que dependa de quién es
  // el afiliado o qué plan pide.
  if (!affiliate.mp_subscription_id) {
    return {
      ok: false,
      mensaje: 'No encontramos una suscripción activa para actualizar. Escribinos y lo resolvemos con vos.',
    }
  }

  const { data: cambioInsertado, error: insertError } = await admin
    .from('plan_changes')
    .insert({
      affiliate_id: affiliate.id,
      from_plan_id: affiliate.plan_id,
      to_plan_id: planDestino.id,
      status: 'pendiente',
    })
    .select('id')
    .single()

  if (insertError) {
    // 23505 = unique_violation de Postgres. El índice único parcial
    // `idx_plan_changes_pendiente_unico` (un solo 'pendiente' por afiliado)
    // lo dispara cuando dos pedidos llegan casi al mismo tiempo (doble click,
    // dos pestañas): la lectura de `cambioPendienteExistente` de arriba es
    // optimista y no alcanza a cubrir esa carrera porque corre ANTES del
    // insert, no de forma atómica con él. No es un error de servidor real —
    // es exactamente la misma regla de negocio del check #6 de
    // `puedeCambiarA`, sólo que ganada por la base en vez de por la lectura
    // previa. Se responde igual que ese caso, no como un 500.
    if (insertError.code === '23505') {
      return {
        ok: false,
        mensaje: 'Ya tenés un cambio de plan en curso. Esperá a que se aplique antes de pedir otro.',
      }
    }
    console.error('[cambiar-plan] insert error:', insertError)
    return { ok: false, mensaje: 'No pudimos registrar el cambio. Intentá de nuevo.' }
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    await admin
      .from('plan_changes')
      .update({ status: 'fallido', mp_resultado: 'MP_ACCESS_TOKEN no configurado' })
      .eq('id', cambioInsertado.id)
    console.error('[cambiar-plan] MP_ACCESS_TOKEN no configurado', {
      affiliateId: affiliate.id,
      cambioId: cambioInsertado.id,
    })
    return {
      ok: false,
      mensaje: 'No pudimos procesar tu cambio de plan en este momento. Nuestro equipo te va a contactar.',
    }
  }

  try {
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preApprovalClient = new PreApproval(mpClient)
    await preApprovalClient.update({
      id: affiliate.mp_subscription_id,
      body: {
        reason: planDestino.name,
        auto_recurring: { transaction_amount: planDestino.price, currency_id: 'ARS' },
      },
    })

    // El monto ya se actualizó en MP, pero el cambio NO se aplica ahora: se
    // deja `status = 'pendiente'` a propósito. El webhook (rama "Already
    // active — extend cobertura_hasta" de `api/webhooks/mercadopago/route.ts`)
    // es quien lo pasa a 'aplicado' cuando se acredite el próximo pago.
    await admin
      .from('plan_changes')
      .update({ mp_resultado: 'monto_actualizado' })
      .eq('id', cambioInsertado.id)

    revalidatePath('/portal')

    return {
      ok: true,
      mensaje: `Listo, registramos tu cambio a ${planDestino.name}. Se va a aplicar en tu próximo ciclo de facturación, cuando se acredite el pago con el nuevo monto — tu cobertura actual sigue vigente hasta entonces.`,
    }
  } catch (err: any) {
    const mpMessage = err?.message ?? err?.cause?.message ?? JSON.stringify(err)

    await admin
      .from('plan_changes')
      .update({ status: 'fallido', mp_resultado: mpMessage })
      .eq('id', cambioInsertado.id)

    // ─────────────────────────────────────────────────────────────────────
    // POR QUÉ NO HAY FALLBACK ACÁ (deliberado, no un olvido):
    //
    // Si el update de monto falla, la tentación es "bueno, creo una
    // PreApproval nueva con el monto correcto". NO. La suscripción vieja
    // (`affiliate.mp_subscription_id`) sigue activa y le va a seguir
    // cobrando al afiliado su monto de siempre en la fecha de siempre. Si acá
    // se crea una segunda suscripción, el afiliado termina con DOS
    // suscripciones activas cobrándole en paralelo — que es exactamente el
    // bug de doble cobro que este flujo tiene que evitar, no producir. La
    // única corrección segura para una suscripción existente es reintentar el
    // `update` sobre la MISMA suscripción, no reemplazarla.
    //
    // Por eso acá se corta: se deja constancia en `plan_changes` (`status =
    // 'fallido'`, `mp_resultado` = el error de MP) para que quede auditable,
    // se loguea con todo el contexto necesario para rastrearlo, se notifica
    // a Previnca por email, y se le devuelve al afiliado un mensaje honesto
    // en vez de un "listo" que no es cierto.
    // ─────────────────────────────────────────────────────────────────────
    console.error('[cambiar-plan] MP update error:', mpMessage, {
      affiliateId: affiliate.id,
      cambioId: cambioInsertado.id,
      mpSubscriptionId: affiliate.mp_subscription_id,
      toPlanId: planDestino.id,
    })

    try {
      const { data: affiliateDatos } = await admin
        .from('affiliates')
        .select('nombre, apellido, email, whatsapp')
        .eq('id', affiliate.id)
        .single()

      if (affiliateDatos) {
        await sendInternalPlanChangeFailedEmail({
          affiliateId: affiliate.id,
          nombre: affiliateDatos.nombre,
          apellido: affiliateDatos.apellido,
          email: affiliateDatos.email,
          whatsapp: affiliateDatos.whatsapp ?? null,
          planActualNombre: planActual?.name ?? 'Plan actual desconocido',
          planDestinoNombre: planDestino.name,
          mpError: mpMessage,
        })
      }
    } catch (emailErr) {
      // Best-effort: si falla el email interno, no debe tapar el error
      // original ni romper la respuesta al afiliado. Ya quedó el console.error
      // de arriba con todo lo necesario para rastrearlo a mano.
      console.error('[cambiar-plan] error notificando fallo interno:', emailErr)
    }

    revalidatePath('/portal')

    // El mensaje dice "tu plan no cambió" y NO "no se hizo ningún cambio en tu
    // cuenta", que es lo que decía antes. La diferencia importa: que `plan_id`
    // no se tocó es verificable —está unas líneas más arriba, nunca se escribe
    // en este camino—, pero el estado del monto en Mercado Pago NO lo sabemos.
    // Un timeout de red puede tirar una excepción acá con el update igual
    // aplicado del lado de MP. Afirmarle a alguien que no se le tocó nada,
    // cuando podría estar por debitársele otro monto, es la clase de promesa
    // que se descubre falsa en el resumen de la tarjeta.
    return {
      ok: false,
      mensaje: 'No pudimos confirmar tu cambio de plan. Tu plan no cambió y nuestro equipo te va a contactar para resolverlo.',
    }
  }
}
