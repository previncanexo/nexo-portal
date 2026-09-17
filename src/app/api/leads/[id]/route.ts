/**
 * PATCH /api/leads/[id]
 * Stage 2 del onboarding: completa los datos del lead, crea una preapproval
 * directa en MP (sin plan template) con external_reference=lead.id y devuelve
 * el init_point como URL de pago. El lead queda en status='completed'.
 *
 * NO se crea ningún affiliate acá: el afiliado se materializa recién cuando MP
 * confirma el pago (webhook). Hasta entonces se pueden generar tantos leads con
 * los mismos datos como haga falta.
 *
 * Returns: { success: true, leadId, affiliateId: null, checkoutUrl }
 */

import { after } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { sendMetaCapiEvents, extractFbCookies, extractClientIp } from '@/lib/meta-capi'
import { findPaidIdentityConflict } from '@/lib/affiliateIdentity'
import { buildLeadIntakeBody, sendLeadIntake, getSfLeadIdForLead, type SalesChannel, type DocumentType } from '@/lib/salesforce/leads'

interface FinalizeLeadInput {
  dni?: string
  fecha_nacimiento?: string
  ciudad?: string
  calle?: string
  numero?: string
  depto?: string
  /** Landing v2 ya no lo manda (el usuario elige en el checkout MP) — opcional */
  medio_pago?: string
  /** Email principal del afiliado. Landing v2 lo manda recién en el PATCH
   *  (step 5) porque el POST inicial lo omite. Si el lead nació sin email
   *  (nuevo flow), este campo es el que lo persiste. */
  email?: string
  /** Email de la cuenta MP para la suscripción. En el nuevo flow del landing
   *  es el mismo que `email` (el usuario declara una sola dirección). */
  mp_email?: string
  /** Plan seleccionado por slug ('nexo-1', 'nexo-2', 'nexo-3') — landing v2. */
  plan_slug?: string
  /** Plan por UUID — compat con clientes viejos. */
  plan_id?: string
  /** ID compartido con el pixel para dedup CAPI CompleteRegistration */
  event_id_complete_registration?: string
  /** ID compartido con el pixel para dedup CAPI InitiateCheckout */
  event_id_initiate_checkout?: string
  event_source_url?: string
  /** GA4 client_id parseado del cookie `_ga` en el browser — necesario para
   *  atribuir el Purchase server-side al mismo usuario en el webhook MP. */
  ga_client_id?: string
  /** Atribución: repetidos aquí por si la sesión perdió el POST inicial y
   *  los captura recién en el PATCH. El backend solo escribe si son truthy
   *  para no pisar first-touch. */
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  fbclid?: string
  gclid?: string
  referer?: string
  landing_url?: string
  // Constantes del canal para SF (opcionales — hay defaults en SF_NEXO_DEFAULTS)
  sales_channel?: string
  document_type?: string
  country?: string
  state?: string
  declared_members_count?: number
  senior_members_count?: number
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

  const { dni, fecha_nacimiento, ciudad, calle, numero, depto, medio_pago, email: bodyEmail, mp_email, plan_id, plan_slug, event_id_complete_registration, event_id_initiate_checkout, event_source_url, ga_client_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, fbclid, gclid, referer, landing_url } = body

  // Identificadores del browser para CAPI Purchase / GA4 purchase server-side
  // (en el webhook MP no podremos leerlos — se persisten en el affiliate).
  const fb = extractFbCookies(req)
  const clientIp = extractClientIp(req)
  const clientUserAgent = req.headers.get('user-agent') ?? undefined

  // Validaciones. El landing v2 pide `medio_pago` en el step 5 junto al
  // `mp_email`, así que lo tratamos como required (con fallback a "tarjeta"
  // por compat con clientes viejos que no lo mandaban).
  if (!dni || !fecha_nacimiento || !ciudad || !calle || !numero || !mp_email) {
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
  if (medio_pago && !['tarjeta', 'mp_balance'].includes(medio_pago)) {
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
    .select('id, status, affiliate_id, checkout_url, para_quien, nombre, apellido, email, whatsapp')
    .eq('id', leadId)
    .maybeSingle()

  if (leadFetchError || !lead) {
    return jsonWithCors(
      { success: false, error: 'lead_not_found', message: 'Lead no encontrado.' },
      { status: 404, origin }
    )
  }

  // Idempotencia #1: el lead ya pagó → hay un afiliado y no se generan más registros.
  if (lead.status === 'converted' && lead.affiliate_id) {
    return jsonWithCors(
      {
        success: false,
        error: 'already_affiliate',
        message: 'Ya existe una afiliación activa con estos datos. Iniciá sesión en el portal.',
      },
      { status: 409, origin }
    )
  }

  // Idempotencia #2: ya completó el formulario y tiene checkout vigente →
  // devolvemos el mismo link en vez de crear otra suscripción en MP.
  if (lead.status === 'completed' && lead.checkout_url) {
    return jsonWithCors(
      { success: true, leadId, affiliateId: null, checkoutUrl: lead.checkout_url },
      { status: 200, origin }
    )
  }

  // Resolver email definitivo: el landing v2 puede mandar el email recién en
  // este PATCH (si el lead nació sin email en step 2). Usamos el body primero
  // (última fuente), y como fallback lo que ya estaba en el lead.
  const finalEmail = (bodyEmail?.trim().toLowerCase()) || lead.email || null

  // 2. La identidad (DNI/email) la reservan SOLO los afiliados pagados.
  //    Mientras no haya pago, se pueden generar todos los leads que hagan falta.
  const identityConflict = await findPaidIdentityConflict(supabase, {
    dni: dni.trim(),
    email: finalEmail ?? undefined,
  })
  if (identityConflict) {
    return jsonWithCors(
      {
        success: false,
        error: identityConflict === 'dni' ? 'dni_taken' : 'email_taken',
        message: identityConflict === 'dni'
          ? 'Ya existe una afiliación con ese DNI. Iniciá sesión en el portal.'
          : 'Ya existe una afiliación con ese email. Iniciá sesión en el portal.',
      },
      { status: 409, origin }
    )
  }

  // 3. Plan: aceptamos `plan_slug` (landing v2) o `plan_id` (clientes viejos).
  //    Si no viene ninguno, cae al más barato como default histórico.
  const planQuery = supabase.from('plans').select('id, name, price')
  const { data: plan } = plan_id
    ? await planQuery.eq('id', plan_id).maybeSingle()
    : plan_slug
      ? await planQuery.eq('slug', plan_slug).maybeSingle()
      : await planQuery.order('price', { ascending: true }).limit(1).maybeSingle()

  // 4. Armar domicilio
  const domicilio = [
    calle.trim(),
    numero.trim(),
    depto?.trim() ? `Dpto. ${depto.trim()}` : '',
  ].filter(Boolean).join(' ')

  // 5. Crear la suscripción directamente en MP SIN plan template.
  //    Con plan template MP pisaba el external_reference y forzaba el matching
  //    por email/DNI (frágil ante emails compartidos, casos como Federico donde
  //    un mismo payer_email tenía sub previas con external_reference de otro
  //    afiliado). Sin plan, external_reference viaja intacto en todos los
  //    eventos (subscription_preapproval, payment, subscription_authorized_payment).
  //
  //    external_reference = leadId: el affiliate NO existe todavía — lo crea el
  //    webhook de MP recién cuando el pago queda aprobado.
  // El payer_email es el email de la cuenta MP. Priorizamos `mp_email` del
  // body (landing v2 lo manda siempre en step 5), después `finalEmail` como
  // fallback. Nunca debería quedar vacío después de la validación previa.
  const payerEmail = (mp_email?.trim()) || finalEmail || ''
  if (!payerEmail) {
    return jsonWithCors(
      { success: false, error: 'missing_email', message: 'Falta el email de la cuenta de MP.' },
      { status: 400, origin }
    )
  }
  const planPrice = plan?.price ?? 19500
  const planName = plan?.name ?? 'Previnca Nexo'

  // Paso donde estamos, para logging estructurado si algo falla y disparamos rollback
  let failStep: 'mp_sub' | 'lead_data' | 'capi' = 'mp_sub'
  try {
    const mpToken = process.env.MP_ACCESS_TOKEN
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN no configurado')

    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const preApprovalClient = new PreApproval(mpClient)
    // Nota crítica del soporte MP (2026-09-16): para Suscripciones, la
    // URL del webhook configurada en el panel de la app NO dispara. Hay que
    // mandar `notification_url` en el body al crear cada preapproval. Sin
    // esto, MP nunca envía el POST /api/webhooks/mercadopago y el affiliate
    // nunca se materializa aunque el pago se apruebe.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexo.portal.previncasalud.com.ar'
    const notificationUrl = `${appUrl}/api/webhooks/mercadopago`
    // Cuando staging usa credenciales de producción de MP para poder recibir
    // webhooks reales (MP no notifica pagos hechos con credenciales de test),
    // marcamos el external_reference con sufijo `-test` para que el portal de
    // producción lo detecte al recibir la notificación y la forwardee a
    // staging en vez de materializar en su propia DB.
    const isStagingForwarding = process.env.MP_STAGING_FORWARDING === 'true'
    const externalReference = isStagingForwarding ? `${leadId}-test` : leadId
    // `notification_url` no está tipado en el SDK pero MP lo acepta — cast.
    const sub = await preApprovalClient.create({
      body: {
        reason: planName,
        external_reference: externalReference,
        payer_email: payerEmail,
        back_url: `${appUrl}/registro/exito`,
        notification_url: notificationUrl,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: planPrice,
          currency_id: 'ARS',
        },
      } as unknown as Parameters<typeof preApprovalClient.create>[0]['body'],
    })
    const subExt = sub as unknown as { id?: string; init_point?: string }
    // MP devuelve el init_point con `activation=true`, un flow que EXIGE que
    // el usuario esté logueado en MP con la cuenta del `payer_email` — si no
    // lo está, MP muestra "Esta página no existe" en vez de ofrecer login o
    // pago como invitado. Quitamos el flag para que caiga siempre al checkout
    // de medios de pago normal, sin requerir sesión previa.
    let checkoutUrl: string | undefined
    if (subExt.init_point) {
      try {
        const u = new URL(subExt.init_point)
        u.searchParams.delete('activation')
        checkoutUrl = u.toString()
      } catch {
        checkoutUrl = subExt.init_point
      }
    }
    const mpSubId = subExt.id
    if (!checkoutUrl || !mpSubId) throw new Error('MP no devolvió init_point/id')

    // 6. Persistir en el lead todo el estado pre-pago: datos del step 2,
    //    trazabilidad y el checkout de MP. El lead pasa a 'completed'
    //    (formulario terminado, pago pendiente) — NO a 'converted': eso lo
    //    hace el webhook cuando MP aprueba y se crea el affiliate.
    failStep = 'lead_data'
    // Atribución: solo se pisa lo previo si viene truthy en este PATCH
    // (respeta first-touch cuando el POST inicial ya la persistió).
    const leadUpdate: Record<string, unknown> = {
      dni: dni.trim(),
      fecha_nacimiento,
      ciudad,
      domicilio,
      // medio_pago puede no venir en el landing v2 (el user elige en el
      // checkout MP). Guardamos null en ese caso.
      medio_pago: medio_pago ?? null,
      // Email: si el lead nació sin email (step 2 landing v2), lo persistimos
      // ahora desde el body. Si ya lo tenía, dejamos el valor existente en la
      // DB (finalEmail resuelve a lead.email en ese caso).
      email: finalEmail,
      mp_email: mp_email?.trim() || null,
      plan_id: plan?.id ?? null,
      checkout_url: checkoutUrl,
      mp_subscription_id: mpSubId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      // IDs del browser para Meta CAPI / GA4 Purchase server-side (los lee el webhook MP)
      fbp: fb.fbp ?? null,
      fbc: fb.fbc ?? null,
      ga_client_id: ga_client_id ?? null,
      client_user_agent: clientUserAgent ?? null,
      client_ip: clientIp ?? null,
    }
    if (utm_source) leadUpdate.utm_source = utm_source
    if (utm_medium) leadUpdate.utm_medium = utm_medium
    if (utm_campaign) leadUpdate.utm_campaign = utm_campaign
    if (utm_term) leadUpdate.utm_term = utm_term
    if (utm_content) leadUpdate.utm_content = utm_content
    if (fbclid) leadUpdate.fbclid = fbclid
    if (gclid) leadUpdate.gclid = gclid
    if (referer) leadUpdate.referer = referer
    if (landing_url) leadUpdate.landing_url = landing_url

    const { error: leadUpdateError } = await supabase.from('leads').update(leadUpdate).eq('id', leadId)
    if (leadUpdateError) throw new Error(`No se pudo guardar el lead: ${leadUpdateError.message}`)

    // Email "completá tu pago" NO se dispara acá: se difiere al cron
    // /api/cron/abandoned-recovery (corre cada 30 min) que lo manda cuando
    // el lead lleva +1h en 'completed' sin pagar. Evita spamear al usuario
    // que se está por redirigir al checkout de MP.

    // CAPI: CompleteRegistration + InitiateCheckout (fire-and-forget)
    failStep = 'capi'
    if (event_id_complete_registration || event_id_initiate_checkout) {
      const userData = {
        email: finalEmail ?? undefined,
        phone: lead.whatsapp,
        firstName: lead.nombre,
        lastName: lead.apellido,
        dni: dni.trim(),
        ciudad,
        externalId: leadId,
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

    // Salesforce /leads — envío del step 3+4 (documento + domicilio). Reusa el
    // sf_lead_id si ya lo guardamos en un envío previo (step 2) para que SF
    // haga merge sobre el mismo Prospecto en vez de crear otro.
    after(async () => {
      try {
        const sfLeadId = await getSfLeadIdForLead(leadId)
        const payload = buildLeadIntakeBody({
          sfLeadId,
          firstName: lead.nombre,
          lastName: lead.apellido ?? '',
          email: finalEmail,
          mobilePhone: lead.whatsapp ?? null,
          documentNumber: dni.trim(),
          birthdate: fecha_nacimiento,
          address: {
            street: domicilio,
            city: ciudad,
            apartment: depto?.trim() || null,
          },
          salesChannel: body.sales_channel as SalesChannel | undefined,
          documentType: body.document_type as DocumentType | undefined,
          // state/country deshabilitados hasta que Nespon confirme el API
          // name exacto del picklist SF ("Argentina" no es válido).
          declaredMembersCount: body.declared_members_count,
          seniorMembersCount: body.senior_members_count,
        })
        await sendLeadIntake({ leadId, payload })
      } catch (err) {
        console.error('[sf/leads step3+4] error', err)
      }
    })

    return jsonWithCors(
      { success: true, leadId, affiliateId: null, checkoutUrl },
      { status: 200, origin }
    )
  } catch (err: unknown) {
    const e = err as { message?: string; cause?: unknown; apiResponse?: unknown }
    console.error('[api/leads/finalize] rollback triggered', JSON.stringify({
      step: failStep,
      leadId,
      message: e?.message ?? String(err),
      cause: e?.cause ?? e?.apiResponse ?? null,
    }))

    // Rollback: no hay affiliate que borrar — solo devolvemos el lead a
    // 'partial' para que reaparezca como incompleto en /admin/leads y el
    // usuario pueda reintentar sin arrastrar un checkout roto.
    try {
      await supabase
        .from('leads')
        .update({ status: 'partial', checkout_url: null, mp_subscription_id: null, completed_at: null })
        .eq('id', leadId)
    } catch (rollbackErr) {
      console.error('[api/leads/finalize] rollback error:', rollbackErr)
    }

    return jsonWithCors(
      { success: false, error: 'mp_error', message: 'Error al procesar el pago. Probá de nuevo.' },
      { status: 500, origin }
    )
  }
}
