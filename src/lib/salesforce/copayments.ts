/**
 * Integración Nexo → Salesforce, endpoint `/copayments` (Copayment-API v0.2.0).
 *
 * Registra el consumo de un módulo on-demand sobre una Cuenta `Active`. El
 * precio sale del catálogo SF (no lo mandamos), y el importe queda calculado
 * del lado de ellos.
 *
 * Requisitos:
 *   - Cuenta SF en estado `Active` (sino: 422 ACCOUNT_NOT_ACTIVE)
 *   - `productCode` existe en el catálogo con precio configurado
 *
 * Mapping de productos on-demand Nexo → productCode SF (entregado por Nespon
 * 2026-09-28):
 *   - COB-OTR-020 → UVP ambulatoria (Psicología On Demand)
 *   - COB-OTR-019 → UVP domiciliaria (Seguros del Hogar On Demand)
 */

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sfPost, isSfConfigured } from './client'

export type CopaymentProductCode = 'COB-OTR-020' | 'COB-OTR-019'

export const COPAYMENT_PRODUCT_CODES = {
  psicologia: 'COB-OTR-020',
  seguro_hogar: 'COB-OTR-019',
} as const satisfies Record<string, CopaymentProductCode>

export interface CopaymentConsumptionPayload {
  messageId: string
  sentAt: string
  accountId: string
  productCode: CopaymentProductCode
  quantity: number
  consumedOn?: string
  consumedFrom?: string
  consumedTo?: string
}

export interface CopaymentAck {
  messageId: string
  coverageId?: string
  coverageStart?: string
  coverageEnd?: string
  productCode?: string
  quantity?: number
  unitPrice?: number
  totalAmount?: number
}

export interface SendCopaymentOptions {
  affiliateId: string
  payload: CopaymentConsumptionPayload
}

export interface SendCopaymentResult {
  ok: boolean
  status: number
  ack: CopaymentAck | null
  error?: string
}

export function buildCopaymentBody(args: {
  accountId: string
  productCode: CopaymentProductCode
  quantity?: number
  consumedOn?: string
}): CopaymentConsumptionPayload {
  return {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    accountId: args.accountId,
    productCode: args.productCode,
    quantity: args.quantity ?? 1,
    ...(args.consumedOn ? { consumedOn: args.consumedOn } : {}),
  }
}

/** Envía un /copayments con persistencia en sf_messages (outbox pattern). */
export async function sendCopaymentConsumption(opts: SendCopaymentOptions): Promise<SendCopaymentResult> {
  if (!isSfConfigured()) {
    console.warn('[sf/copayments] skipped — SF env vars not set')
    return { ok: false, status: 0, ack: null, error: 'sf_not_configured' }
  }

  const supabase = createAdminClient()
  const endpoint = '/copayments'

  const { error: insertError } = await supabase.from('sf_messages').insert({
    message_id: opts.payload.messageId,
    endpoint,
    affiliate_id: opts.affiliateId,
    request_body: opts.payload,
  })
  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: true, status: 0, ack: null, error: 'duplicate_message_id' }
    }
    console.error('[sf/copayments] outbox insert error', insertError)
    return { ok: false, status: 0, ack: null, error: 'db_outbox_error' }
  }

  let result: Awaited<ReturnType<typeof sfPost<CopaymentAck>>>
  try {
    result = await sfPost<CopaymentAck>(endpoint, opts.payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sf/copayments] network error', message)
    await supabase
      .from('sf_messages')
      .update({ response_status: 0, response_body: { error: message }, responded_at: new Date().toISOString() })
      .eq('message_id', opts.payload.messageId)
    return { ok: false, status: 0, ack: null, error: 'sf_network_error' }
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
    console.error('[sf/copayments] SF returned error', result.status, result.rawBody)
    return { ok: false, status: result.status, ack: null, error: 'sf_http_error' }
  }
  return { ok: true, status: result.status, ack: result.body }
}
