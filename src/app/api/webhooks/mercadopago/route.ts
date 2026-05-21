import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail } from '@/lib/emails'

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

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

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
          .select('status, nombre, email, affiliate_number, plan:plans(name)')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate && affiliate.status === 'pending') {
          await supabase
            .from('affiliates')
            .update({
              status: 'active',
              mp_subscription_id: body.data.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', preApproval.external_reference)

          await sendActivationEmail({
            nombre: affiliate.nombre,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            plan: Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan,
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
          .eq('external_id', String(payment.id))

        if ((count ?? 0) === 0) {
          const preApprovalClient = new PreApproval(mpClient)
          const preApproval = await preApprovalClient.get({ id: (payment as any).subscription_id })

          if (preApproval.external_reference) {
            await supabase.from('payments').insert({
              affiliate_id: preApproval.external_reference,
              amount: payment.transaction_amount ?? 0,
              currency: payment.currency_id ?? 'ARS',
              status: 'approved',
              payment_method: payment.payment_type_id ?? null,
              external_id: String(payment.id),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            // Extend cobertura_hasta by 1 month on each successful monthly payment
            const { data: affiliateData } = await supabase
              .from('affiliates')
              .select('cobertura_hasta')
              .eq('id', preApproval.external_reference)
              .single()

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
  } catch (err) {
    console.error('[mp-webhook]', err)
  }

  return NextResponse.json({ ok: true })
}
