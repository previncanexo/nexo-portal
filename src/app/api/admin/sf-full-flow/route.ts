/**
 * TEMPORAL — endpoint que arma un flujo completo Lead + Sale contra SF con
 * datos ficticios, SIN pasar por Mercado Pago ni por la landing. Sirve para
 * verificar aislado que la integración SF (creación de Prospecto + Cuenta)
 * funciona end-to-end desde nuestro lado.
 *
 * Flujo:
 *   1. Genera datos ficticios (DNI, email, nombre, address)
 *   2. Dispara /leads con esos datos → obtiene sf_lead_id
 *   3. Dispara /sales con el sf_lead_id + offerCode XTEFO + policyholder
 *      completo → obtiene sf_account_id
 *   4. Devuelve el ack completo de ambos endpoints
 *
 * Uso:
 *   GET /api/admin/sf-full-flow?dni=99887766&email=foo@test.com
 *   Header: Authorization: Bearer <CRON_SECRET>
 *
 * Ambos params son opcionales — genera valores random si faltan.
 *
 * BORRAR después de la fase de tests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sfPost } from '@/lib/salesforce/client'
import { buildLeadIntakeBody } from '@/lib/salesforce/leads'
import { buildSaleIntakeBody } from '@/lib/salesforce/sales'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

function randomDni(): string {
  // 8 dígitos, primer dígito 1-9
  return String(Math.floor(10000000 + Math.random() * 89999999))
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

interface LeadAck {
  leadId?: string
  messageId?: string
  created?: boolean
  readyToSell?: boolean
  missingForSale?: string[]
}

interface SaleAck {
  accountId?: string
  accountCode?: string
  orderId?: string
  orderNumber?: string
  totalAmount?: number
  accountStatus?: string
  missingForActivation?: string[]
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dni = url.searchParams.get('dni') ?? randomDni()
  const suffix = randomSuffix()
  const email = url.searchParams.get('email') ?? `test.sf.${suffix}@yopmail.com`
  const firstName = url.searchParams.get('firstName') ?? 'Test'
  const lastName = url.searchParams.get('lastName') ?? `SFFlow${suffix}`
  const offerCode = url.searchParams.get('offerCode') ?? 'XTEFO'

  const result: {
    input: { dni: string; email: string; firstName: string; lastName: string; offerCode: string }
    lead: { request: unknown; status: number; response: unknown; sfLeadId: string | null }
    sale?: { request: unknown; status: number; response: unknown }
  } = {
    input: { dni, email, firstName, lastName, offerCode },
    lead: { request: null, status: 0, response: null, sfLeadId: null },
  }

  // 1) /leads
  const leadPayload = buildLeadIntakeBody({
    firstName,
    lastName,
    email,
    mobilePhone: '3415555555',
    documentNumber: dni,
    birthdate: '1990-01-15',
    address: {
      street: 'Calle Falsa 123',
      city: 'Rosario',
      apartment: null,
      postalCode: '2000',
    },
  })
  result.lead.request = leadPayload
  const leadResult = await sfPost<LeadAck>('/leads', leadPayload)
  result.lead.status = leadResult.status
  result.lead.response = leadResult.rawBody
  result.lead.sfLeadId = leadResult.body?.leadId ?? null

  if (!result.lead.sfLeadId) {
    return NextResponse.json({ ...result, aborted: 'no_sf_lead_id' }, { status: 200 })
  }

  // 2) /sales usando el sfLeadId recién obtenido
  const salePayload = buildSaleIntakeBody({
    sfLeadId: result.lead.sfLeadId,
    effectiveDate: new Date().toISOString().slice(0, 10),
    policyholder: {
      documentType: 'DNI',
      documentNumber: dni,
      firstName,
      lastName,
      birthdate: '1990-01-15',
      email,
      mobilePhone: '3415555555',
      address: {
        country: 'Argentina',
        state: 'Santa Fe',
        street: 'Calle Falsa 123',
        city: 'Rosario',
        postalCode: '2000',
      },
    },
    offerCode,
    method: 'MercadoPago',
    paymentReference: '999999999999',
  })

  const saleResult = await sfPost<SaleAck>('/sales', salePayload)
  result.sale = {
    request: salePayload,
    status: saleResult.status,
    response: saleResult.rawBody,
  }

  return NextResponse.json(result)
}
