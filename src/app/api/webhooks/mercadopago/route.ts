import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendCredentialsEmail, sendInternalNewMemberEmail, sendPaymentConfirmedEmail, sendSuspensionEmail } from '@/lib/emails'
import { addOneMonth } from '@/lib/dateUtils'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? 'https://n8n.previncasalud.com.ar/webhook/mercadopago-nexo-webhook'

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

  const message = `id:${notificationId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(message).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
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
    if (!xSignature || !verifyMpSignature(xSignature, xRequestId, body.data.id, webhookSecret)) {
      console.warn('[mp-webhook] Invalid or missing signature — request rejected')
      return NextResponse.json({ ok: true })
    }
  }

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  const supabase = createAdminClient()

  try {
    if (body.type === 'subscription_preapproval' && body.data?.id) {
      const preApprovalClient = new PreApproval(mpClient)
      const preApproval = await preApprovalClient.get({ id: body.data.id })

      // external_reference may live on the subscription or on the per-affiliate plan
      let affiliateId = preApproval.external_reference || null
      if (!affiliateId && (preApproval as any).preapproval_plan_id) {
        try {
          const planClient = new PreApprovalPlan(mpClient)
          const mpPlan = await planClient.get({ preApprovalPlanId: String((preApproval as any).preapproval_plan_id) })
          affiliateId = (mpPlan as any).external_reference || null
        } catch (planErr) {
          console.error('[mp-webhook] Could not fetch plan for external_reference:', planErr)
        }
      }

      if (!affiliateId) {
        return NextResponse.json({ ok: true })
      }

      // Override preApproval.external_reference so the rest of the handler uses affiliateId
      ;(preApproval as any).external_reference = affiliateId

      if (preApproval.status === 'authorized') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('status, user_id, nombre, apellido, dni, email, affiliate_number, fecha_nacimiento, domicilio, plan:plans(name)')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate && affiliate.status === 'pending') {
          const today = new Date().toISOString().split('T')[0]
          const certNum = parseInt(affiliate.affiliate_number ?? '0', 10)
          const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

          let userId = affiliate.user_id as string | null | undefined
          let tempPassword: string | undefined
          if (!userId) {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
            const bytes = randomBytes(12)
            tempPassword = Array.from(bytes).map(b => chars[b % chars.length]).join('')
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: affiliate.email,
              password: tempPassword,
              email_confirm: true,
            })
            if (!authError && authData?.user) {
              userId = authData.user.id
            } else {
              console.error('[mp-webhook] createUser error:', authError)
            }
          }

          await supabase
            .from('affiliates')
            .update({
              status: 'active',
              mp_subscription_id: body.data.id,
              cobertura_desde: today,
              cobertura_hasta: addOneMonth(today),
              farmacia_number: farmaciaNumber,
              updated_at: new Date().toISOString(),
              ...(userId ? { user_id: userId } : {}),
            })
            .eq('id', preApproval.external_reference)

          // Insert payment record for the initial subscription charge.
          // Uses a stable key (sub-{preapproval_id}) so the payment branch can
          // replace it with the real mp_payment_id when that event arrives.
          const placeholderPaymentId = `sub-${body.data.id}`
          const { count: placeholderCount } = await supabase
            .from('payments')
            .select('id', { count: 'exact', head: true })
            .eq('mp_payment_id', placeholderPaymentId)

          if ((placeholderCount ?? 0) === 0) {
            const amount = Math.round((preApproval as any).auto_recurring?.transaction_amount ?? 0)
            if (amount > 0) {
              await supabase.from('payments').insert({
                affiliate_id: preApproval.external_reference,
                mp_payment_id: placeholderPaymentId,
                mp_status: 'approved',
                amount,
                currency: (preApproval as any).auto_recurring?.currency_id ?? 'ARS',
                paid_at: new Date().toISOString(),
                period_from: today,
                period_to: addOneMonth(today),
              })
            }
          }

          const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan

          if (tempPassword) {
            await sendCredentialsEmail({
              nombre: affiliate.nombre,
              email: affiliate.email,
              affiliate_number: affiliate.affiliate_number,
              farmacia_number: farmaciaNumber,
              temp_password: tempPassword,
              plan: resolvedPlan,
            })
          }

          await sendActivationEmail({
            nombre: affiliate.nombre,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            farmacia_number: farmaciaNumber,
            plan: resolvedPlan,
          })

          await sendInternalNewMemberEmail({
            id: affiliateId,
            nombre: affiliate.nombre,
            apellido: affiliate.apellido,
            dni: affiliate.dni,
            email: affiliate.email,
            affiliate_number: affiliate.affiliate_number,
            farmacia_number: farmaciaNumber,
            plan: resolvedPlan,
            fecha_nacimiento: affiliate.fecha_nacimiento ?? null,
            domicilio: affiliate.domicilio ?? null,
          })

          revalidatePath('/admin')
          revalidatePath('/admin/afiliados')
          revalidatePath(`/admin/afiliados/${preApproval.external_reference}`)
        }
      }

      // Cancelled or paused by MP → suspend active affiliate
      if (preApproval.status === 'cancelled' || preApproval.status === 'paused') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('status, nombre, email')
          .eq('id', preApproval.external_reference)
          .single()

        if (affiliate?.status === 'active') {
          await supabase
            .from('affiliates')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', preApproval.external_reference)
          await sendSuspensionEmail(affiliate.nombre, affiliate.email)
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

          // external_reference may be on the subscription or on the plan (PreApprovalPlan flow)
          let paymentAffiliateId = preApproval.external_reference || null
          if (!paymentAffiliateId && (preApproval as any).preapproval_plan_id) {
            try {
              const planClient = new PreApprovalPlan(mpClient)
              const mpPlan = await planClient.get({ preApprovalPlanId: String((preApproval as any).preapproval_plan_id) })
              paymentAffiliateId = (mpPlan as any).external_reference || null
            } catch (planErr) {
              console.error('[mp-webhook] payment: could not fetch plan for external_reference:', planErr)
            }
          }
          if (paymentAffiliateId) {
            ;(preApproval as any).external_reference = paymentAffiliateId
          }

          if (preApproval.external_reference) {
            const todayStr = new Date().toISOString().split('T')[0]

            // Remove the preapproval placeholder if it exists, then insert the real payment
            await supabase
              .from('payments')
              .delete()
              .eq('affiliate_id', preApproval.external_reference)
              .eq('mp_payment_id', `sub-${(payment as any).subscription_id}`)

            await supabase.from('payments').insert({
              affiliate_id: preApproval.external_reference,
              mp_payment_id: String(payment.id),
              mp_status: 'approved',
              amount: Math.round(payment.transaction_amount ?? 0),
              currency: payment.currency_id ?? 'ARS',
              paid_at: new Date().toISOString(),
              period_from: todayStr,
              period_to: addOneMonth(todayStr),
            })

            const { data: affiliateData } = await supabase
              .from('affiliates')
              .select('status, user_id, nombre, apellido, dni, email, affiliate_number, fecha_nacimiento, domicilio, plan:plans(name), cobertura_hasta')
              .eq('id', preApproval.external_reference)
              .single()

            // Activate pending affiliate when first payment is approved
            if (affiliateData?.status === 'pending') {
              const today = new Date().toISOString().split('T')[0]
              const certNum = parseInt(affiliateData.affiliate_number ?? '0', 10)
              const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

              let userId = affiliateData.user_id as string | null | undefined
              let tempPassword: string | undefined
              if (!userId) {
                const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
                const bytes = randomBytes(12)
                tempPassword = Array.from(bytes).map(b => chars[b % chars.length]).join('')
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                  email: affiliateData.email,
                  password: tempPassword,
                  email_confirm: true,
                })
                if (!authError && authData?.user) {
                  userId = authData.user.id
                } else {
                  console.error('[mp-webhook] createUser error:', authError)
                }
              }

              await supabase
                .from('affiliates')
                .update({
                  status: 'active',
                  mp_subscription_id: String((payment as any).subscription_id),
                  cobertura_desde: today,
                  cobertura_hasta: addOneMonth(today),
                  farmacia_number: farmaciaNumber,
                  updated_at: new Date().toISOString(),
                  ...(userId ? { user_id: userId } : {}),
                })
                .eq('id', preApproval.external_reference)

              const resolvedPlan = Array.isArray(affiliateData.plan)
                ? (affiliateData.plan[0] ?? null)
                : affiliateData.plan

              if (tempPassword) {
                await sendCredentialsEmail({
                  nombre: affiliateData.nombre,
                  email: affiliateData.email,
                  affiliate_number: affiliateData.affiliate_number,
                  farmacia_number: farmaciaNumber,
                  temp_password: tempPassword,
                  plan: resolvedPlan,
                })
              }

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
                fecha_nacimiento: affiliateData.fecha_nacimiento ?? null,
                domicilio: affiliateData.domicilio ?? null,
              })

              revalidatePath('/admin')
              revalidatePath('/admin/afiliados')
              revalidatePath(`/admin/afiliados/${preApproval.external_reference}`)
            } else {
              // Already active — extend cobertura_hasta from the later of today or current cobertura_hasta
              const hoy = new Date().toISOString().split('T')[0]
              const baseDate = affiliateData?.cobertura_hasta && affiliateData.cobertura_hasta > hoy
                ? affiliateData.cobertura_hasta
                : hoy
              await supabase
                .from('affiliates')
                .update({
                  cobertura_hasta: addOneMonth(baseDate),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', preApproval.external_reference)

              // Notify user that their monthly payment was processed
              if (affiliateData?.email) {
                await sendPaymentConfirmedEmail(
                  affiliateData.nombre,
                  affiliateData.email,
                  Math.round(payment.transaction_amount ?? 0),
                  payment.currency_id ?? 'ARS',
                )
              }
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
