/**
 * POST /api/leads
 * Stage 1 del onboarding: crea un lead parcial con los datos básicos
 * (para_quien, nombre, apellido, email, whatsapp).
 *
 * Returns: { success: true, leadId: string }
 *  -- o, si el email ya pertenece a un afiliado PAGADO: { success: false, error: 'email_taken' } (409)
 *
 * Un email/DNI solo queda reservado una vez pagado: pueden coexistir N leads
 * (y N affiliates 'pending') con los mismos datos.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { sendMetaCapiEvents, extractFbCookies, extractClientIp } from '@/lib/meta-capi'
import { findPaidIdentityConflict } from '@/lib/affiliateIdentity'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CreateLeadInput {
  para_quien?: string
  nombre?: string
  apellido?: string
  email?: string
  whatsapp?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  fbclid?: string
  gclid?: string
  referer?: string
  landing_url?: string
  /** ID compartido con el pixel para dedup CAPI ↔ pixel */
  event_id?: string
  /** URL donde ocurrió el evento (window.location.href del browser) */
  event_source_url?: string
  // Constantes del canal (opcionales — server tiene defaults en SF_NEXO_DEFAULTS)
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

export async function POST(req: Request) {
  const origin = req.headers.get('origin')

  let body: CreateLeadInput
  try {
    body = await req.json()
  } catch {
    return jsonWithCors({ success: false, error: 'Body inválido' }, { status: 400, origin })
  }

  const { para_quien, nombre, apellido, email, whatsapp, utm_source, utm_medium, utm_campaign, utm_term, utm_content, fbclid, gclid, referer, landing_url, event_id, event_source_url } = body

  // Validaciones de campos obligatorios. El email dejó de pedirse en el step 2
  // del landing v2 — el usuario lo carga recién en el step 5 junto al email de
  // MP, y llega al backend en el PATCH. Acá aceptamos el lead sin email y lo
  // guardamos como null hasta que el PATCH lo complete.
  if (!para_quien || !nombre || !apellido || !whatsapp) {
    return jsonWithCors(
      { success: false, error: 'missing_fields', message: 'Faltan campos obligatorios.' },
      { status: 400, origin }
    )
  }
  if (!['para_mi', 'otra_persona'].includes(para_quien)) {
    return jsonWithCors(
      { success: false, error: 'invalid_para_quien' },
      { status: 400, origin }
    )
  }
  // Si el landing manda email (compat con clientes viejos), validamos formato.
  if (email && !EMAIL_RE.test(email.trim())) {
    return jsonWithCors(
      { success: false, error: 'invalid_email', message: 'Email inválido.' },
      { status: 400, origin }
    )
  }
  if (whatsapp.replace(/\D/g, '').length < 8) {
    return jsonWithCors(
      { success: false, error: 'invalid_whatsapp', message: 'WhatsApp inválido.' },
      { status: 400, origin }
    )
  }

  const supabase = createAdminClient()
  const emailLower = email ? email.trim().toLowerCase() : null

  // Bloquear solo si el email ya pertenece a un affiliate PAGADO (active/suspended).
  // Los 'pending' no reservan identidad: pueden existir N leads con los mismos datos.
  // Skip si el lead no trae email todavía (step 2 del landing v2).
  if (emailLower) {
    const conflict = await findPaidIdentityConflict(supabase, { email: emailLower })
    if (conflict === 'email') {
      return jsonWithCors(
        { success: false, error: 'email_taken', message: 'Ya existe una cuenta activa con ese email. Iniciá sesión en el portal.' },
        { status: 409, origin }
      )
    }
  }

  // Insert lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      para_quien,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailLower,
      whatsapp: whatsapp.trim(),
      status: 'partial',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      referer: referer || null,
      landing_url: landing_url || null,
    })
    .select('id')
    .single()

  if (leadError || !lead) {
    console.error('[api/leads] insert error:', leadError)
    return jsonWithCors(
      { success: false, error: 'db_error', message: 'No se pudo crear el lead.' },
      { status: 500, origin }
    )
  }

  // Salesforce /leads — NO se envía en step 2. Aunque el contrato-YAML de SF
  // dice `required: [messageId, sentAt, lastName]`, la implementación real de
  // la org rechaza con 400 si el cuerpo no trae al menos una "clave de
  // reconocimiento": `leadId` o `documentType + documentNumber`. En step 2
  // todavía no tenemos el DNI (se pide en step 3), así que el primer envío
  // arranca en el PATCH cuando ya está el documento.

  // CAPI: Meta Conversions API — fire-and-forget para no demorar la respuesta
  if (event_id) {
    const fb = extractFbCookies(req)
    sendMetaCapiEvents([{
      event_name: 'Lead',
      event_id,
      event_source_url,
      user_data: {
        email: emailLower ?? undefined,
        phone: whatsapp.trim(),
        firstName: nombre.trim(),
        lastName: apellido.trim(),
        externalId: lead.id,
        fbp: fb.fbp,
        fbc: fb.fbc,
        clientIp: extractClientIp(req),
        clientUserAgent: req.headers.get('user-agent') ?? undefined,
      },
      custom_data: { content_name: 'nexo-onboarding' },
    }]).catch(() => {})
  }

  return jsonWithCors({ success: true, leadId: lead.id }, { status: 201, origin })
}
