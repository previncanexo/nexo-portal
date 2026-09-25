/**
 * TEMPORAL — endpoint para probar distintos offerCodes contra SF sin tener
 * que hacer nuevos pagos MP. Reusa los datos de un affiliate existente y el
 * paymentReference del pago original.
 *
 * Uso:
 *   GET /api/admin/sf-test-sale?affiliateId=<id>&offerCode=<code>&paymentReference=<mp_payment_id>
 *   Header: Authorization: Bearer <CRON_SECRET>
 *
 * Devuelve el ack de SF o el error 4xx.
 *
 * BORRAR una vez terminada la fase de tests con Nespon.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildSaleIntakeBody, sendSaleIntake } from '@/lib/salesforce/sales'
import { getSfLeadIdForLead } from '@/lib/salesforce/leads'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const affiliateId = url.searchParams.get('affiliateId')
  const offerCode = url.searchParams.get('offerCode')
  const paymentReference = url.searchParams.get('paymentReference')

  if (!affiliateId || !offerCode) {
    return NextResponse.json({ error: 'affiliateId + offerCode required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: aff, error: affErr } = await supabase
    .from('affiliates')
    .select('id, nombre, apellido, dni, email, whatsapp, fecha_nacimiento, domicilio, ciudad')
    .eq('id', affiliateId)
    .maybeSingle()

  if (affErr || !aff) {
    return NextResponse.json({ error: 'affiliate not found', detail: affErr?.message }, { status: 404 })
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('id')
    .eq('affiliate_id', affiliateId)
    .maybeSingle()
  const sfLeadId = lead?.id ? await getSfLeadIdForLead(lead.id) : null

  const policyholderAddress = aff.domicilio || aff.ciudad ? {
    country: 'Argentina',
    state: 'Santa Fe',
    street: aff.domicilio ?? aff.ciudad ?? '',
    city: aff.ciudad ?? '',
  } : undefined

  const payload = buildSaleIntakeBody({
    sfLeadId,
    effectiveDate: new Date().toISOString().slice(0, 10),
    policyholder: {
      documentType: 'DNI',
      documentNumber: aff.dni,
      firstName: aff.nombre,
      lastName: aff.apellido ?? aff.nombre,
      birthdate: aff.fecha_nacimiento ?? null,
      email: aff.email,
      mobilePhone: aff.whatsapp ?? null,
      address: policyholderAddress,
    },
    offerCode,
    method: 'MercadoPago',
    paymentReference,
  })

  const result = await sendSaleIntake({ affiliateId, payload })
  return NextResponse.json({
    offerCode,
    paymentReference,
    messageId: payload.messageId,
    result,
  })
}
