/**
 * Integración Nexo → Salesforce, endpoint `/sales` (I-2: venta cerrada).
 *
 * Se dispara en el webhook MP `subscription_preapproval` con status `authorized`,
 * después de materializar el afiliado y de enviar el `/leads` final. SF crea
 * la Cuenta en estado `InPreparation` y devuelve `accountId` / `accountCode`
 * que persistimos en `affiliates.sf_account_id` / `.sf_account_code`.
 *
 * Bloqueantes pendientes de Nespon (los cubrimos con placeholders):
 *   - `offerCode`: usamos `plan.slug` (nexo-1, nexo-2, nexo-3) como código.
 *     Cuando Nespon entregue el catálogo real, hay que mapear en
 *     `PLAN_SLUG_TO_OFFER_CODE` de este archivo.
 *   - `firstPayment.method` / `recurringPayment.method`: hardcode `CreditCard`
 *     mientras el 100% del flow es MP con tarjeta. Cuando aparezcan MP balance
 *     u otros medios, mapear desde `payment.payment_type_id`.
 *   - `accountNumber`: usamos `first_six + XXXXXX + last_four` (mask PCI-DSS).
 *     Si Nespon rechaza el formato hay que consultarles el aceptado.
 *   - Payment-Confirmation-API (activa la Cuenta): Nespon todavía no la entregó.
 *     Hasta que exista, la Cuenta queda `InPreparation` y `missingForActivation`
 *     va a incluir `["Payment confirmation"]`.
 */

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sfPost, isSfConfigured } from './client'
import { SF_NEXO_DEFAULTS } from './defaults'
import type { DocumentType, SalesChannel, SfAddress } from './leads'
import { sanitizeEmail, sanitizePhone, sanitizeText, sanitizeDni, sanitizeDate } from './sanitize'

/** Aplica sanitización a un Person antes de mandarlo a SF. */
function sanitizePerson(p: SfPerson): SfPerson {
  const cleanAddress: SfAddress | undefined = p.address ? (() => {
    const a: SfAddress = {}
    const street = sanitizeText(p.address?.street, 255)
    const city = sanitizeText(p.address?.city, 40)
    if (street || city) {
      a.country = sanitizeText(p.address?.country, 80) ?? SF_NEXO_DEFAULTS.country
      a.state = sanitizeText(p.address?.state, 80) ?? SF_NEXO_DEFAULTS.state
    }
    if (street) a.street = street
    if (city) a.city = city
    const apt = sanitizeText(p.address?.apartment, 10)
    if (apt) a.apartment = apt
    return Object.keys(a).length > 0 ? a : undefined
  })() : undefined
  return {
    documentType: p.documentType,
    documentNumber: sanitizeDni(p.documentNumber) ?? p.documentNumber,
    firstName: sanitizeText(p.firstName, 40),
    lastName: sanitizeText(p.lastName, 80) ?? p.lastName,
    birthdate: sanitizeDate(p.birthdate),
    email: sanitizeEmail(p.email),
    mobilePhone: sanitizePhone(p.mobilePhone),
    ...(cleanAddress ? { address: cleanAddress } : {}),
  }
}

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

export type FirstPaymentMethod =
  | 'CreditCard'
  | 'DirectDebitCBU'
  | 'MercadoPago'
  | 'BankTransfer'
  | 'PagoMisCuentas'
  | 'RapipagoPagoFacil'
  | 'BarcodeInPerson'

export interface SfPerson {
  documentType: DocumentType
  documentNumber: string
  firstName?: string | null
  lastName: string
  birthdate?: string | null
  email?: string | null
  mobilePhone?: string | null
  address?: SfAddress
}

export interface SfPaymentMethod {
  method: FirstPaymentMethod
  accountNumber?: string | null
  cardExpirationMonth?: string | null
  cardExpirationYear?: string | null
}

export interface SfOffer {
  offerCode: string
}

export interface SaleIntakePayload {
  messageId: string
  sentAt: string
  salesChannel?: SalesChannel | null
  leadId?: string | null
  effectiveDate?: string | null
  policyholder: SfPerson
  declaredMembersCount?: number
  seniorMembersCount?: number
  offers: SfOffer[]
  firstPayment: SfPaymentMethod
  recurringPayment: SfPaymentMethod
}

export interface SaleIntakeAck {
  messageId: string
  leadId?: string
  accountId: string
  accountCode?: string
  policyholderContactId?: string
  orderId: string
  orderNumber: string
  totalAmount: number
  accountStatus: 'InPreparation' | 'Active'
  missingForActivation: string[]
}

// -------------------------------------------------------------------------
// MAPPINGS — placeholders hasta que Nespon entregue el catálogo real
// -------------------------------------------------------------------------

/**
 * Mapping de slugs de plan Nexo → offerCode SF (catálogo entregado por
 * Nespon 2026-09-16). Los códigos son los `ProductCode` del objeto
 * `Product2` en la org de SF.
 *
 * `XTEFO-ONESHOT-SF` y `XTEFO-SUSCRIPCION-SF` también existen en el
 * catálogo pero son categorías / tipos de venta (no planes por sí solos),
 * no las usamos en el flow del canal digital.
 */
const PLAN_SLUG_TO_OFFER_CODE: Record<string, string> = {
  'nexo-1': 'XTEFO-NEXO1-SF',
  'nexo-2': 'XTEFO-NEXO2-SF',
  'nexo-3': 'XTEFO-NEXO3-SF',
}

export function resolveOfferCode(planSlug: string | null | undefined): string {
  if (!planSlug) return 'XTEFO-NEXO1-SF'
  return PLAN_SLUG_TO_OFFER_CODE[planSlug] ?? planSlug
}

// -------------------------------------------------------------------------
// BUILDER
// -------------------------------------------------------------------------

export interface SaleIntakeSource {
  sfLeadId?: string | null
  effectiveDate?: string | null
  policyholder: SfPerson
  offerCode: string
  card?: {
    firstSixDigits?: string | null
    lastFourDigits?: string | null
    expirationMonth?: string | null
    expirationYear?: string | null
  }
  method?: FirstPaymentMethod
  salesChannel?: SalesChannel | null
  declaredMembersCount?: number
  seniorMembersCount?: number
}

/**
 * SF UAT rechaza cualquier `accountNumber` que no sean 16 dígitos numéricos
 * completos (verificado empíricamente 2026-09-16: mask `6+XXXXXX+4` responde
 * `INVALID_PAYMENT_METHOD: El número de la tarjeta es inválido`). Como MP no
 * expone el PAN completo por PCI-DSS, la única opción segura es OMITIR el
 * campo — SF acepta el `/sales` sin `accountNumber`.
 */
function maskCardNumber(_firstSix?: string | null, _lastFour?: string | null): string | null {
  return null
}

export function buildSaleIntakeBody(src: SaleIntakeSource): SaleIntakePayload {
  // Default = MercadoPago (no CreditCard): SF exige cardExpiration para
  // CreditCard, y MP no siempre devuelve esos datos a tiempo desde el
  // webhook (carrera con /authorized_payments/search). Con MercadoPago SF
  // no exige card details y el semántico también es correcto — el pago
  // efectivamente vino por MP. Si el caller sabe que hay tarjeta y tiene
  // los datos del card, puede pasar method='CreditCard' explícito.
  const method = src.method ?? 'MercadoPago'
  const accountNumber = maskCardNumber(src.card?.firstSixDigits, src.card?.lastFourDigits)

  const paymentBase: SfPaymentMethod = { method }
  if (accountNumber) paymentBase.accountNumber = accountNumber
  if (method === 'CreditCard') {
    if (src.card?.expirationMonth) paymentBase.cardExpirationMonth = src.card.expirationMonth
    if (src.card?.expirationYear) paymentBase.cardExpirationYear = src.card.expirationYear
  }

  const body: SaleIntakePayload = {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    salesChannel: src.salesChannel ?? SF_NEXO_DEFAULTS.salesChannel,
    policyholder: sanitizePerson(src.policyholder),
    declaredMembersCount: src.declaredMembersCount ?? SF_NEXO_DEFAULTS.declaredMembersCount,
    seniorMembersCount: src.seniorMembersCount ?? SF_NEXO_DEFAULTS.seniorMembersCount,
    offers: [{ offerCode: sanitizeText(src.offerCode, 255) ?? src.offerCode }],
    firstPayment: paymentBase,
    recurringPayment: paymentBase,
  }

  if (src.sfLeadId) body.leadId = src.sfLeadId
  if (src.effectiveDate) body.effectiveDate = src.effectiveDate

  return body
}

// -------------------------------------------------------------------------
// SEND
// -------------------------------------------------------------------------

export interface SendSaleOptions {
  affiliateId: string
  payload: SaleIntakePayload
}

export interface SendSaleResult {
  ok: boolean
  status: number
  ack: SaleIntakeAck | null
  accountId: string | null
  accountCode: string | null
  error?: string
}

/**
 * Enviar SF `/sales` con persistencia en `sf_messages` y guardado de
 * `sf_account_id` / `sf_account_code` en el affiliate.
 */
export async function sendSaleIntake(opts: SendSaleOptions): Promise<SendSaleResult> {
  if (!isSfConfigured()) {
    console.warn('[sf/sales] skipped — SF env vars not set')
    return { ok: false, status: 0, ack: null, accountId: null, accountCode: null, error: 'sf_not_configured' }
  }

  const supabase = createAdminClient()
  const endpoint = '/sales'

  const { error: insertError } = await supabase.from('sf_messages').insert({
    message_id: opts.payload.messageId,
    endpoint,
    affiliate_id: opts.affiliateId,
    request_body: opts.payload,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: true, status: 0, ack: null, accountId: null, accountCode: null, error: 'duplicate_message_id' }
    }
    console.error('[sf/sales] outbox insert error', insertError)
    return { ok: false, status: 0, ack: null, accountId: null, accountCode: null, error: 'db_outbox_error' }
  }

  let result: Awaited<ReturnType<typeof sfPost<SaleIntakeAck>>>
  try {
    result = await sfPost<SaleIntakeAck>(endpoint, opts.payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sf/sales] network error', message)
    await supabase
      .from('sf_messages')
      .update({ response_status: 0, response_body: { error: message }, responded_at: new Date().toISOString() })
      .eq('message_id', opts.payload.messageId)
    return { ok: false, status: 0, ack: null, accountId: null, accountCode: null, error: 'sf_network_error' }
  }

  await supabase
    .from('sf_messages')
    .update({
      response_status: result.status,
      response_body: result.rawBody as object | null,
      responded_at: new Date().toISOString(),
    })
    .eq('message_id', opts.payload.messageId)

  if (!result.ok || !result.body) {
    console.error('[sf/sales] SF returned error', result.status, result.rawBody)
    return { ok: false, status: result.status, ack: null, accountId: null, accountCode: null, error: 'sf_http_error' }
  }

  const ack = result.body
  const accountId = ack.accountId ?? null
  const accountCode = ack.accountCode ?? null

  if (accountId || accountCode) {
    await supabase
      .from('affiliates')
      .update({
        ...(accountId ? { sf_account_id: accountId } : {}),
        ...(accountCode ? { sf_account_code: accountCode } : {}),
      })
      .eq('id', opts.affiliateId)
  }

  return { ok: true, status: result.status, ack, accountId, accountCode }
}
