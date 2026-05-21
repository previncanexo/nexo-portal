'use server'

import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail } from '@/lib/emails'

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

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

  try {
    // Subscription authorized → activate affiliate
    if (body.type === 'subscription_preapproval' && body.data?.id) {
      const preApprovalClient = new PreApproval(mpClient)
      const preApproval = await preApprovalClient.get({ id: body.data.id })

      if (preApproval.status === 'authorized' && preApproval.external_reference) {
        const supabase = createAdminClient()

        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('status, nombre, email, affiliate_number, plan:plans(name)')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate && affiliate.status === 'pending') {
          await supabase
            .from('affiliates')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', preApproval.external_reference)

          await sendActivationEmail({
            nombre: affiliate.nombre,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            plan: Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan,
          })
        }
      }
    }

    // Subscription payment approved → record in payments table
    if (body.type === 'payment' && body.data?.id) {
      const paymentClient = new Payment(mpClient)
      const payment = await paymentClient.get({ id: Number(body.data.id) })

      if (payment.status === 'approved' && (payment as any).subscription_id) {
        const supabase = createAdminClient()

        // Idempotency: skip if already recorded
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
          }
        }
      }
    }
  } catch (err) {
    console.error('[mp-webhook]', err)
  }

  // Always return 200 so MP doesn't retry
  return NextResponse.json({ ok: true })
}
