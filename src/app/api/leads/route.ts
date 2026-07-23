/**
 * POST /api/leads
 * Stage 1 del onboarding: crea un lead parcial con los datos básicos
 * (para_quien, nombre, apellido, email, whatsapp).
 *
 * Returns: { success: true, leadId: string }
 *  -- o, si el email ya tiene cuenta activa: { success: false, error: 'email_taken' } (409)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { sendMetaCapiEvents, extractFbCookies, extractClientIp } from '@/lib/meta-capi'

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

  // Validaciones de campos obligatorios
  if (!para_quien || !nombre || !apellido || !email || !whatsapp) {
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
  if (!EMAIL_RE.test(email.trim())) {
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
  const emailLower = email.trim().toLowerCase()

  // Bloquear si el email ya pertenece a un affiliate no-pending (active/suspended/cancelled)
  const { data: existingAffiliate } = await supabase
    .from('affiliates')
    .select('status')
    .eq('email', emailLower)
    .maybeSingle()

  if (existingAffiliate && existingAffiliate.status !== 'pending') {
    return jsonWithCors(
      { success: false, error: 'email_taken', message: 'Probá registrándote con otro email.' },
      { status: 409, origin }
    )
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

  // CAPI: Meta Conversions API — fire-and-forget para no demorar la respuesta
  if (event_id) {
    const fb = extractFbCookies(req)
    sendMetaCapiEvents([{
      event_name: 'Lead',
      event_id,
      event_source_url,
      user_data: {
        email: emailLower,
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
