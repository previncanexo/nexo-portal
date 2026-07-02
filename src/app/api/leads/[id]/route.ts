/**
 * PATCH /api/leads/[id]
 * Stage 2 del onboarding: completa los datos faltantes del lead, lo transforma
 * en affiliate (status='pending'), crea una preapproval directa en MP (sin plan
 * template) con external_reference=affiliate.id, y devuelve el init_point como
 * URL de pago. Cuando el user autoriza en MP la sub pasa a authorized y llega
 * el webhook que activa al affiliate.
 *
 * Returns: { success: true, leadId, affiliateId, checkoutUrl }
 */

import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { sendPendingConfirmationEmail } from '@/lib/emails'
import { sendMetaCapiEvents, extractFbCookies, extractClientIp } from '@/lib/meta-capi'

interface FinalizeLeadInput {
  dni?: string
  fecha_nacimiento?: string
  ciudad?: string
  calle?: string
  numero?: string
  depto?: string
  medio_pago?: string
  mp_email?: string
  plan_id?: string
  /** ID compartido con el pixel para dedup CAPI CompleteRegistration */
  event_id_complete_registration?: string
  /** ID compartido con el pixel para dedup CAPI InitiateCheckout */
  event_id_initiate_checkout?: string
  event_source_url?: string
  /** GA4 client_id parseado del cookie `_ga` en el browser — necesario para
   *  atribuir el Purchase server-side al mismo usuario en el webhook MP. */
  ga_client_id?: string
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

/**
 * GET /api/leads/[id]
 * Devuelve el estado actual del lead. El frontend lo usa al montar el
 * onboarding para validar el `leadId` guardado en localStorage y, si está
 * `partial`, restaurar los datos del step 1-2 saltando al step 3.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get('origin')
  const { id: leadId } = await params

  const supabase = createAdminClient()
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, status, para_quien, nombre, apellido, email, whatsapp, affiliate_id, created_at')
    .eq('id', leadId)
    .maybeSingle()

  if (error || !lead) {
    return jsonWithCors(
      { success: false, error: 'lead_not_found' },
      { status: 404, origin }
    )
  }

  return jsonWithCors({ success: true, lead }, { status: 200, origin })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get('origin')
  const { id: leadId } = await params

  let body: FinalizeLeadInput
  try {
    body = await req.json()
  } catch {
    return jsonWithCors({ success: false, error: 'Body inválido' }, { status: 400, origin })
  }

  const { dni, fecha_nacimiento, ciudad, calle, numero, depto, medio_pago, mp_email, plan_id, event_id_complete_registration, event_id_initiate_checkout, event_source_url, ga_client_id } = body

  // Identificadores del browser para CAPI Purchase / GA4 purchase server-side
  // (en el webhook MP no podremos leerlos — se persisten en el affiliate).
  const fb = extractFbCookies(req)
  const clientIp = extractClientIp(req)
  const clientUserAgent = req.headers.get('user-agent') ?? undefined

  // Validaciones
  if (!dni || !fecha_nacimiento || !ciudad || !calle || !numero || !medio_pago) {
    return jsonWithCors(
      { success: false, error: 'missing_fields', message: 'Faltan campos obligatorios.' },
      { status: 400, origin }
    )
  }
  if (!/^\d{7,8}$/.test(dni.trim())) {
    return jsonWithCors(
      { success: false, error: 'invalid_dni', message: 'El DNI debe tener 7 u 8 dígitos.' },
      { status: 400, origin }
    )
  }
  if (!['tarjeta', 'mp_balance'].includes(medio_pago)) {
    return jsonWithCors(
      { success: false, error: 'invalid_medio_pago' },
      { status: 400, origin }
    )
  }
  // Edad ≥18
  const birth = new Date(fecha_nacimiento + 'T12:00:00')
  if (isNaN(birth.getTime())) {
    return jsonWithCors({ success: false, error: 'invalid_birth_date' }, { status: 400, origin })
  }
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
    - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
  if (age < 18) {
    return jsonWithCors(
      { success: false, error: 'underage', message: 'Debés ser mayor de 18 años.' },
      { status: 400, origin }
    )
  }

  const supabase = createAdminClient()

  // 1. Fetch lead
  const { data: lead, error: leadFetchError } = await supabase
    .from('leads')
    .select('id, status, affiliate_id, para_quien, nombre, apellido, email, whatsapp')
    .eq('id', leadId)
    .maybeSingle()

  if (leadFetchError || !lead) {
    return jsonWithCors(
      { success: false, error: 'lead_not_found', message: 'Lead no encontrado.' },
      { status: 404, origin }
    )
  }
  // Idempotencia: si el lead ya fue convertido, devolver la checkoutUrl
  // persistida en el affiliate (evita crear una sub duplicada en MP).
  if (lead.status === 'converted' && lead.affiliate_id) {
    const { data: existingAff } = await supabase
      .from('affiliates')
      .select('checkout_url')
      .eq('id', lead.affiliate_id)
      .maybeSingle()
    if (existingAff?.checkout_url) {
      return jsonWithCors(
        { success: true, leadId, affiliateId: lead.affiliate_id, checkoutUrl: existingAff.checkout_url },
        { status: 200, origin }
      )
    }
  }

  // 2. Plan (seleccionado o el más barato por default)
  const planQuery = supabase.from('plans').select('id, name, price')
  const { data: plan } = plan_id
    ? await planQuery.eq('id', plan_id).maybeSingle()
    : await planQuery.order('price', { ascending: true }).limit(1).maybeSingle()

  // 3. Armar domicilio
  const domicilio = [
    calle.trim(),
    numero.trim(),
    depto?.trim() ? `Dpto. ${depto.trim()}` : '',
  ].filter(Boolean).join(' ')

  // 4. Crear affiliate (status=pending; será activado por el webhook tras autorización MP)
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .insert({
      nombre: lead.nombre,
      apellido: lead.apellido,
      dni: dni.trim(),
      email: lead.email,
      whatsapp: lead.whatsapp,
      ciudad,
      domicilio,
      fecha_nacimiento,
      plan_id: plan?.id ?? null,
      user_id: null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (affiliateError) {
    const isDniDup = (affiliateError as { code?: string })?.code === '23505' &&
      affiliateError.message.toLowerCase().includes('dni')
    const isEmailDup = (affiliateError as { code?: string })?.code === '23505' &&
      affiliateError.message.toLowerCase().includes('email')
    return jsonWithCors(
      {
        success: false,
        error: isDniDup ? 'dni_taken' : isEmailDup ? 'email_taken' : 'affiliate_insert_error',
        message: isDniDup
          ? 'Ya existe una cuenta con ese DNI.'
          : isEmailDup
          ? 'Probá registrándote con otro email.'
          : `Error al crear el afiliado: ${affiliateError.message}`,
      },
      { status: isDniDup || isEmailDup ? 409 : 500, origin }
    )
  }

  // 5. Crear sub en MP via PreApproval.create() SIN plan template.
  //    Antes usábamos ?preapproval_plan_id=X en la URL, pero MP no persistía
  //    el external_reference del query — heredaba el del plan (contaminado)
  //    o quedaba null → webhook no podía matchear al affiliate.
  //    Ahora creamos la sub directamente via API con external_reference en el
  //    body. MP lo persiste OK y responde con init_point (URL de autorización).
  const payerEmail = medio_pago === 'mp_balance' && mp_email ? mp_email.trim() : lead.email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexo.portal.previncasalud.com.ar'
  const mpToken = process.env.MP_ACCESS_TOKEN

  try {
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN no configurado')
    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const preApprovalClient = new PreApproval(mpClient)
    const mpSub = await preApprovalClient.create({
      body: {
        reason: plan?.name ?? 'Previnca Nexo',
        external_reference: affiliate.id,
        payer_email: payerEmail,
        back_url: `${appUrl}/registro/exito`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        status: 'pending',
      },
    })
    if (!mpSub.init_point) throw new Error('MP no devolvió init_point')
    const checkoutUrl = mpSub.init_point
    // Persistir el link de pago para la recuperación de abandono/rechazo.
    await supabase
      .from('affiliates')
      .update({ checkout_url: checkoutUrl })
      .eq('id', affiliate.id)
    // mp_subscription_id se completa cuando llega el webhook subscription_preapproval:authorized

    // 7. Marcar lead como converted, asociarlo al affiliate y guardar datos del paso 2
    await supabase
      .from('leads')
      .update({
        status: 'converted',
        affiliate_id: affiliate.id,
        dni: dni.trim(),
        fecha_nacimiento,
        ciudad,
        domicilio,
        medio_pago,
        mp_email: mp_email?.trim() || null,
        plan_id: plan?.id ?? null,
        // IDs del browser para Meta CAPI / GA4 Purchase server-side (los lee el webhook MP)
        fbp: fb.fbp ?? null,
        fbc: fb.fbc ?? null,
        ga_client_id: ga_client_id ?? null,
        client_user_agent: clientUserAgent ?? null,
        client_ip: clientIp ?? null,
      })
      .eq('id', leadId)

    // 8. Email "completá tu pago" — fire-and-forget
    sendPendingConfirmationEmail({
      nombre: lead.nombre,
      email: lead.email,
      checkoutUrl,
    }).catch((err) => console.error('[api/leads] sendPendingConfirmationEmail:', err))

    // 9. CAPI: CompleteRegistration + InitiateCheckout (fire-and-forget)
    if (event_id_complete_registration || event_id_initiate_checkout) {
      const userData = {
        email: lead.email,
        phone: lead.whatsapp,
        firstName: lead.nombre,
        lastName: lead.apellido,
        dni: dni.trim(),
        ciudad,
        externalId: affiliate.id,
        fbp: fb.fbp,
        fbc: fb.fbc,
        clientIp,
        clientUserAgent,
      }
      const value = plan?.price ?? 19500
      const events = []
      if (event_id_complete_registration) {
        events.push({
          event_name: 'CompleteRegistration',
          event_id: event_id_complete_registration,
          event_source_url,
          user_data: userData,
          custom_data: {
            currency: 'ARS',
            value,
            content_name: plan?.name ?? 'Previnca Nexo',
          },
        })
      }
      if (event_id_initiate_checkout) {
        events.push({
          event_name: 'InitiateCheckout',
          event_id: event_id_initiate_checkout,
          event_source_url,
          user_data: userData,
          custom_data: {
            currency: 'ARS',
            value,
            content_name: plan?.name ?? 'Previnca Nexo',
            content_ids: plan?.id ? [plan.id] : undefined,
          },
        })
      }
      sendMetaCapiEvents(events).catch(() => {})
    }

    return jsonWithCors(
      { success: true, leadId, affiliateId: affiliate.id, checkoutUrl },
      { status: 200, origin }
    )
  } catch (err: unknown) {
    const e = err as { message?: string; cause?: unknown; apiResponse?: unknown }
    console.error('[api/leads/finalize] MP error:', e?.message ?? err, JSON.stringify(e?.cause ?? e?.apiResponse ?? ''))

    // Rollback: borrar el affiliate creado (el webhook todavía no se enteró de nada)
    try {
      await supabase.from('affiliates').delete().eq('id', affiliate.id)
    } catch (rollbackErr) {
      console.error('[api/leads/finalize] rollback error:', rollbackErr)
    }

    return jsonWithCors(
      { success: false, error: 'mp_error', message: 'Error al procesar el pago. Probá de nuevo.' },
      { status: 500, origin }
    )
  }
}
