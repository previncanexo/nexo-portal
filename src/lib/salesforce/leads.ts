/**
 * Integración Nexo → Salesforce, endpoint `/leads` (I-1: alta y enriquecimiento
 * del Prospecto).
 *
 * Contrato: cada envío es un upsert idempotente. La primera llamada sobre una
 * persona la crea (201); las siguientes la enriquecen (200) sin pisar campos
 * que ya estaban. La idempotencia la garantiza `messageId` (uuid único por
 * envío, persistido en `sf_messages` antes de mandar).
 *
 * Cuándo se dispara desde Nexo:
 *   - Step 2 (POST /api/leads):      firstName, lastName, email, mobilePhone
 *   - Step 3+4 (PATCH /api/leads/id): documentNumber, birthdate, address.*
 *   - Webhook MP `authorized`:        confirmación final antes de /sales
 */

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sfPost, isSfConfigured } from './client'
import { SF_NEXO_DEFAULTS } from './defaults'

// -------------------------------------------------------------------------
// TYPES — matchean el contrato del YAML (Lead-Intake-API.yaml)
// -------------------------------------------------------------------------

export type DocumentType = 'DNI' | 'Passport' | 'LE' | 'LC' | 'CUIT' | 'Other'
export type SalesChannel = 'Nexo' | 'WhatsApp' | 'DoorToDoor' | 'ContactCenter' | 'SocialMedia'

export interface SfAddress {
  street?: string
  floor?: string | null
  apartment?: string | null
  tower?: string | null
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface LeadIntakePayload {
  messageId: string
  sentAt: string
  salesChannel?: SalesChannel | null
  leadId?: string | null
  firstName?: string | null
  lastName: string
  documentType?: DocumentType | null
  documentNumber?: string | null
  email?: string | null
  mobilePhone?: string | null
  birthdate?: string | null // YYYY-MM-DD
  declaredMembersCount?: number | null
  seniorMembersCount?: number | null
  address?: SfAddress
}

export interface LeadIntakeAck {
  messageId: string
  leadId: string
  created: boolean
  readyToSell: boolean
  missingForSale: string[]
  matchesExistingPerson?: boolean | null
}

// -------------------------------------------------------------------------
// BUILDERS — arman el body a partir del row de leads / affiliates
// -------------------------------------------------------------------------

/**
 * Fuente del cuerpo de `/leads`. Deja que el caller elija qué campos incluir
 * (step 2 solo manda name/email/phone, step 3+4 agrega docNumber/birthdate/addr).
 * Los campos nulos/undefined se omiten al final para respetar el semantics de
 * "progressive profiling" — mandar `null` en SF vaciaría el campo, y no
 * queremos eso.
 */
export interface LeadIntakeSource {
  /** SF leadId ya obtenido de un envío previo — si existe, va en el body */
  sfLeadId?: string | null
  firstName?: string | null
  lastName: string
  documentNumber?: string | null
  email?: string | null
  mobilePhone?: string | null
  birthdate?: string | null
  address?: {
    street?: string | null
    city?: string | null
    apartment?: string | null
  }
  /** Overrides opcionales de las constantes del canal (el front puede mandar
   *  distintos valores; si no, se usa el default de Nexo). */
  salesChannel?: SalesChannel | null
  documentType?: DocumentType | null
  state?: string | null
  country?: string | null
  declaredMembersCount?: number | null
  seniorMembersCount?: number | null
}

export function buildLeadIntakeBody(src: LeadIntakeSource): LeadIntakePayload {
  const address: SfAddress = {}
  if (src.address?.street) address.street = src.address.street
  if (src.address?.city) address.city = src.address.city
  if (src.address?.apartment) address.apartment = src.address.apartment
  // `state` y `country` NO se aplican por default. La org UAT rechaza con
  // `FIELD_INTEGRITY_EXCEPTION A country/territory must be specified before
  // specifying a state value` cuando mandamos `country="Argentina"` — el
  // picklist SF no acepta ese valor literal. Hasta que Nespon confirme el
  // API name exacto del picklist, mandamos solo lo que el caller pase
  // explícitamente (hoy: nada — el landing no los manda tampoco).
  if (src.state) address.state = src.state
  if (src.country) address.country = src.country

  const body: LeadIntakePayload = {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    lastName: src.lastName,
  }

  if (src.sfLeadId) body.leadId = src.sfLeadId
  if (src.firstName) body.firstName = src.firstName
  if (src.email) body.email = src.email
  if (src.mobilePhone) body.mobilePhone = src.mobilePhone
  if (src.birthdate) body.birthdate = src.birthdate

  // Constantes del canal — siempre las mandamos aunque el front las omita.
  body.salesChannel = src.salesChannel ?? SF_NEXO_DEFAULTS.salesChannel
  body.declaredMembersCount = src.declaredMembersCount ?? SF_NEXO_DEFAULTS.declaredMembersCount
  body.seniorMembersCount = src.seniorMembersCount ?? SF_NEXO_DEFAULTS.seniorMembersCount

  // documentType/Number solo si hay número (evita mandar el enum solo).
  if (src.documentNumber) {
    body.documentType = src.documentType ?? SF_NEXO_DEFAULTS.documentType
    body.documentNumber = src.documentNumber
  }

  if (Object.keys(address).length > 0) body.address = address

  return body
}

// -------------------------------------------------------------------------
// SEND — persiste sf_messages, hace el POST, guarda el ack
// -------------------------------------------------------------------------

export interface SendLeadOptions {
  /** UUID del lead en Nexo — FK a `sf_messages.lead_id`. Puede ser null en
   *  el envío del webhook MP si el lead ya fue borrado (raro). */
  leadId: string | null
  /** UUID del affiliate en Nexo — FK a `sf_messages.affiliate_id`, opcional
   *  (solo en el envío del webhook MP cuando ya materializamos el afiliado) */
  affiliateId?: string | null
  payload: LeadIntakePayload
}

export interface SendLeadResult {
  ok: boolean
  status: number
  ack: LeadIntakeAck | null
  sfLeadId: string | null
  /** Errores para el caller — solo los usa el logging, no bloquean el flow */
  error?: string
}

/**
 * Enviar un lead intake a SF con persistencia auditable.
 *
 * Flujo:
 *   1. INSERT en `sf_messages` (status/ack pendientes) — sirve de "outbox".
 *      El UNIQUE en `message_id` bloquea reenvíos accidentales.
 *   2. POST a SF `/leads`.
 *   3. UPDATE `sf_messages` con status + body de la respuesta.
 *   4. Si el ack trae `leadId`, guardarlo en `leads.sf_lead_id` (y en
 *      `affiliates.sf_lead_id` si `affiliateId` viene).
 *
 * NO throwea si SF falla — devuelve `ok: false` para que el caller decida.
 * El caller típico es un `after()` fire-and-forget, no bloqueamos la respuesta
 * del user por un error de SF.
 */
export async function sendLeadIntake(opts: SendLeadOptions): Promise<SendLeadResult> {
  // No-op silencioso mientras no estén las credenciales OAuth (bloqueadas por
  // Nespon). Mejor no ensuciar sf_messages con envíos que sabemos que no salen.
  if (!isSfConfigured()) {
    console.warn('[sf/leads] skipped — SF env vars not set')
    return { ok: false, status: 0, ack: null, sfLeadId: null, error: 'sf_not_configured' }
  }

  const supabase = createAdminClient()
  const endpoint = '/leads'

  // 1. Outbox: registrar el intento antes de mandar. Si el INSERT falla por
  //    unique violation es un reenvío del mismo messageId — devolvemos sin
  //    reintentar (SF ya lo procesó una vez).
  const { error: insertError } = await supabase.from('sf_messages').insert({
    message_id: opts.payload.messageId,
    endpoint,
    lead_id: opts.leadId ?? null,
    affiliate_id: opts.affiliateId ?? null,
    request_body: opts.payload,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      // duplicate key — reenvío. No hacemos POST porque SF también deduplica.
      return { ok: true, status: 0, ack: null, sfLeadId: null, error: 'duplicate_message_id' }
    }
    console.error('[sf/leads] outbox insert error', insertError)
    return { ok: false, status: 0, ack: null, sfLeadId: null, error: 'db_outbox_error' }
  }

  // 2. POST a SF
  let result: Awaited<ReturnType<typeof sfPost<LeadIntakeAck>>>
  try {
    result = await sfPost<LeadIntakeAck>(endpoint, opts.payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sf/leads] network error', message)
    await supabase
      .from('sf_messages')
      .update({ response_status: 0, response_body: { error: message }, responded_at: new Date().toISOString() })
      .eq('message_id', opts.payload.messageId)
    return { ok: false, status: 0, ack: null, sfLeadId: null, error: 'sf_network_error' }
  }

  // 3. Persist ack
  await supabase
    .from('sf_messages')
    .update({
      response_status: result.status,
      response_body: result.rawBody as object | null,
      responded_at: new Date().toISOString(),
    })
    .eq('message_id', opts.payload.messageId)

  if (!result.ok || !result.body) {
    console.error('[sf/leads] SF returned error', result.status, result.rawBody)
    return { ok: false, status: result.status, ack: null, sfLeadId: null, error: 'sf_http_error' }
  }

  const ack = result.body
  const sfLeadId = ack.leadId ?? null

  // 4. Guardar sf_lead_id en el lead (y en el affiliate si aplica).
  if (sfLeadId) {
    if (opts.leadId) {
      await supabase.from('leads').update({ sf_lead_id: sfLeadId }).eq('id', opts.leadId)
    }
    if (opts.affiliateId) {
      await supabase.from('affiliates').update({ sf_lead_id: sfLeadId }).eq('id', opts.affiliateId)
    }
  }

  return { ok: true, status: result.status, ack, sfLeadId }
}

// -------------------------------------------------------------------------
// HELPERS — atajos para los call sites
// -------------------------------------------------------------------------

/**
 * Obtiene el `sf_lead_id` guardado de un envío previo (para mandarlo en el
 * body y que SF haga merge sobre el mismo Prospecto en vez de crear otro).
 */
export async function getSfLeadIdForLead(leadId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('leads')
    .select('sf_lead_id')
    .eq('id', leadId)
    .maybeSingle()
  return data?.sf_lead_id ?? null
}
