import { createHmac, timingSafeEqual } from 'crypto'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendInternalNewMemberEmail } from '@/lib/emails'

const N8N_WEBHOOK_URL = 'https://n8n.previncasalud.com.ar/webhook/mercadopago-nexo-webhook'

function verifyMpSignature(
  xSignature: string,
  xRequestId: string,
  notificationId: string,
  secret: string,
): boolean {
  const parts: Record<string, string> = {}
  for (const chunk of xSignature.split(',')) {
    const [k, v] = chunk.split('=', 2)
    if (k && v) parts[k.trim()] = v.trim()
  }
  const { ts, v1 } = parts
  if (!ts || !v1) return false

  const message = `id:${notificationId};request-id:${xRequestId};ts:${ts}`
  const expected = createHmac('sha256', secret).update(message).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

function addOneMonth(dateStr: string | null): string {
  const base = dateStr ? new Date(dateStr) : new Date()
  base.setMonth(base.getMonth() + 1)
  return base.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  let body: { type?: string; action?: string; data?: { id?: string } }

  // Capture headers before body parsing (needed for n8n forward)
  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  // Forward raw payload to n8n after response is sent — does not affect current circuit
  after(async () => {
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(xSignature && { 'x-signature': xSignature }),
          ...(xRequestId && { 'x-request-id': xRequestId }),
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error('[mp-webhook] n8n forward error:', err)
    }
  })

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ ok: true })
  }

  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  if (webhookSecret && body.data?.id) {
    const xSignature = req.headers.get('x-signature') ?? ''
    const xRequestId = req.headers.get('x-request-id') ?? ''
    if (xSignature && !verifyMpSignature(xSignature, xRequestId, body.data.id, webhookSecret)) {
      console.warn('[mp-webhook] Invalid signature — request rejected')
      return NextResponse.json({ ok: true })
    }
  }

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  const supabase = createAdminClient()

  try {
    if (body.type === 'subscription_preapproval' && body.data?.id) {
      const preApprovalClient = new PreApproval(mpClient)
      const preApproval = await preApprovalClient.get({ id: body.data.id })

      if (!preApproval.external_reference) {
        return NextResponse.json({ ok: true })
      }

      if (preApproval.status === 'authorized') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('status, nombre, apellido, dni, email, affiliate_number, plan:plans(name)')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate && affiliate.status === 'pending') {
          const today = new Date().toISOString().split('T')[0]
          await supabase
            .from('affiliates')
            .update({
              status: 'active',
              mp_subscription_id: body.data.id,
              cobertura_desde: today,
              cobertura_hasta: addOneMonth(today),
              updated_at: new Date().toISOString(),
            })
            .eq('id', preApproval.external_reference)

          const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan
          const certNum = parseInt(affiliate.affiliate_number ?? '0', 10)
          const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

          await sendActivationEmail({
            nombre: affiliate.nombre,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            farmacia_number: farmaciaNumber,
            plan: resolvedPlan,
          })

          await sendInternalNewMemberEmail({
            id: preApproval.external_reference,
            nombre: affiliate.nombre,
            apellido: affiliate.apellido,
            dni: affiliate.dni,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            farmacia_number: farmaciaNumber,
            plan: resolvedPlan,
          })
        }
      }

      // Cancelled or paused by MP → suspend active affiliate
      if (preApproval.status === 'cancelled' || preApproval.status === 'paused') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('status')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate?.status === 'active') {
          await supabase
            .from('affiliates')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', preApproval.external_reference)
        }
      }
    }

    if (body.type === 'payment' && body.data?.id) {
      const paymentClient = new Payment(mpClient)
      const payment = await paymentClient.get({ id: Number(body.data.id) })

      if (payment.status === 'approved' && (payment as any).subscription_id) {
        const { count } = await supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('mp_payment_id', String(payment.id))

        if ((count ?? 0) === 0) {
          const preApprovalClient = new PreApproval(mpClient)
          const preApproval = await preApprovalClient.get({ id: (payment as any).subscription_id })

          if (preApproval.external_reference) {
            const today = new Date()
            const nextMonth = new Date(today)
            nextMonth.setMonth(nextMonth.getMonth() + 1)

            await supabase.from('payments').insert({
              affiliate_id: preApproval.external_reference,
              mp_payment_id: String(payment.id),
              mp_status: 'approved',
              amount: Math.round(payment.transaction_amount ?? 0),
              currency: payment.currency_id ?? 'ARS',
              paid_at: new Date().toISOString(),
              period_from: today.toISOString().split('T')[0],
              period_to: nextMonth.toISOString().split('T')[0],
            })

            const { data: affiliateData } = await supabase
              .from('affiliates')
              .select('status, nombre, apellido, dni, email, affiliate_number, plan:plans(name), cobertura_hasta')
              .eq('id', preApproval.external_reference)
              .single()

            // Activate pending affiliate when first payment is approved
            if (affiliateData?.status === 'pending') {
              const today = new Date().toISOString().split('T')[0]
              await supabase
                .from('affiliates')
                .update({
                  status: 'active',
                  mp_subscription_id: String((payment as any).subscription_id),
                  cobertura_desde: today,
                  cobertura_hasta: addOneMonth(today),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', preApproval.external_reference)

              const resolvedPlan = Array.isArray(affiliateData.plan)
                ? (affiliateData.plan[0] ?? null)
                : affiliateData.plan
              const certNum = parseInt(affiliateData.affiliate_number ?? '0', 10)
              const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

              await sendActivationEmail({
                nombre: affiliateData.nombre,
                email: affiliateData.email,
                affiliate_number: affiliateData.affiliate_number,
                farmacia_number: farmaciaNumber,
                plan: resolvedPlan,
              })

              await sendInternalNewMemberEmail({
                id: preApproval.external_reference,
                nombre: affiliateData.nombre,
                apellido: affiliateData.apellido,
                dni: affiliateData.dni,
                email: affiliateData.email,
                affiliate_number: affiliateData.affiliate_number,
                farmacia_number: farmaciaNumber,
                plan: resolvedPlan,
              })
            } else {
              // Already active — just extend cobertura_hasta
              await supabase
                .from('affiliates')
                .update({
                  cobertura_hasta: addOneMonth(affiliateData?.cobertura_hasta ?? null),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', preApproval.external_reference)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[mp-webhook]', err)
  }

  return NextResponse.json({ ok: true })
}
