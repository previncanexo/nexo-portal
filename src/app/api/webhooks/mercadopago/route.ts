import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { MercadoPagoConfig, PreApproval, PreApprovalPlan, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendCredentialsEmail, sendInternalNewMemberEmail, sendPaymentConfirmedEmail, sendSuspensionEmail, sendPaymentRejectedEmail, sendInternalPaymentRejectedEmail } from '@/lib/emails'
import { sendMetaCapiEvents } from '@/lib/meta-capi'
import { sendGa4Events } from '@/lib/ga4-mp'
import { addOneMonth, todayAR } from '@/lib/dateUtils'

// -------------------------------------------------------------------------
// HELPERS — matching por email (en vez de external_reference)
// -------------------------------------------------------------------------

/**
 * De un CUIT (11 digitos) obtiene el DNI (8 digitos del medio).
 * Formato CUIT: <2 dig prefijo><8 dig DNI><1 dig verificador>
 * Ej: 20370951447 → 37095144
 */
function dniFromCuit(cuit: string | null | undefined): string | null {
  if (!cuit) return null
  const digits = String(cuit).replace(/\D/g, '')
  if (digits.length !== 11) return null
  return digits.substring(2, 10)
}

interface PayerInfo {
  email: string | null
  dni: string | null   // extraído del CUIT (identification.number)
  payerId: number | null
}

/**
 * Obtiene datos del pagador para una sub de MP, haciendo el hop:
 *   sub_id → authorized_payments → payment → payer.{email, identification, id}
 * Necesario porque el objeto preapproval nunca expone payer_email real.
 */
async function getPayerInfoFromSub(mpToken: string, subId: string): Promise<PayerInfo> {
  const empty: PayerInfo = { email: null, dni: null, payerId: null }
  try {
    const authRes = await fetch(
      `https://api.mercadopago.com/authorized_payments/search?preapproval_id=${subId}`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    )
    if (!authRes.ok) return empty
    const authData = await authRes.json()
    const firstPaymentId = authData?.results?.[0]?.payment?.id
    if (!firstPaymentId) return empty

    const payRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${firstPaymentId}`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    )
    if (!payRes.ok) return empty
    const payment = await payRes.json()
    const payer = payment?.payer ?? {}
    return {
      email: payer.email ?? null,
      dni: dniFromCuit(payer.identification?.number),
      payerId: payer.id != null ? Number(payer.id) : null,
    }
  } catch (err) {
    console.error('[mp-webhook] getPayerInfoFromSub error:', err)
    return empty
  }
}

/**
 * Busca un affiliate PENDING cuyo email coincida con el payer_email de MP.
 * Verifica en 2 niveles:
 *   1. affiliates.email (email de cuenta principal)
 *   2. leads.mp_email (email de la cuenta MP que el user declaró en onboarding
 *      cuando eligió "dinero en cuenta" — puede diferir del email principal)
 */
type PendingAffiliate = {
  id: string
  status: string
  user_id: string | null
  nombre: string
  apellido: string | null
  dni: string
  email: string
  whatsapp: string | null
  ciudad: string | null
  affiliate_number: string | null
  fecha_nacimiento: string | null
  domicilio: string | null
  plan: { name: string | null; price: number | null } | { name: string | null; price: number | null }[] | null
  purchase_event_sent_at: string | null
}

async function findPendingAffiliate(
  supabase: ReturnType<typeof createAdminClient>,
  info: PayerInfo,
): Promise<PendingAffiliate | null> {
  const affSelect = 'id, status, user_id, nombre, apellido, dni, email, whatsapp, ciudad, affiliate_number, fecha_nacimiento, domicilio, plan:plans(name, price), purchase_event_sent_at'

  // 1) match por DNI (señal fuerte — es único legal por persona)
  if (info.dni) {
    const { data: byDni } = await supabase
      .from('affiliates')
      .select(affSelect)
      .eq('status', 'pending')
      .eq('dni', info.dni)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (byDni) return byDni as PendingAffiliate
  }

  // 2) match por email del afiliado
  if (info.email) {
    const { data: byAff } = await supabase
      .from('affiliates')
      .select(affSelect)
      .eq('status', 'pending')
      .eq('email', info.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (byAff) return byAff as PendingAffiliate

    // 3) match por lead.mp_email → affiliate (caso "para otra persona" con dinero en cuenta)
    const { data: lead } = await supabase
      .from('leads')
      .select('affiliate_id')
      .eq('mp_email', info.email)
      .not('affiliate_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lead?.affiliate_id) {
      const { data: byLead } = await supabase
        .from('affiliates')
        .select(affSelect)
        .eq('id', lead.affiliate_id)
        .eq('status', 'pending')
        .maybeSingle()
      if (byLead) return byLead as PendingAffiliate
    }
  }

  return null
}

// -------------------------------------------------------------------------
// TYPES
// -------------------------------------------------------------------------

// MP SDK types are incomplete — these interfaces cover the fields we actually use
interface MPPreApprovalExt {
  external_reference?: string | null
  preapproval_plan_id?: string
  auto_recurring?: { transaction_amount?: number; currency_id?: string }
}
interface MPPlanExt {
  external_reference?: string | null
}
interface MPPaymentExt {
  subscription_id?: number | string
}

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
      const subId = String(body.data.id)
      const pa = preApproval as unknown as MPPreApprovalExt

      if (preApproval.status === 'authorized') {
        // Match #1: por mp_subscription_id ya guardado (renovación / re-notificación).
        const { data: alreadyActive } = await supabase
          .from('affiliates')
          .select('id')
          .eq('mp_subscription_id', subId)
          .maybeSingle()
        if (alreadyActive) {
          return NextResponse.json({ ok: true })
        }

        // Match #2: por payer (activación inicial). Ya no confiamos en
        // external_reference — MP no lo persistía correctamente con hosted
        // checkout de plan template. Ahora resolvemos el affiliate por:
        //   1. DNI extraído del CUIT del pagador (más fuerte)
        //   2. payer_email == affiliate.email
        //   3. payer_email == lead.mp_email (caso "para otra persona")
        const payerInfo = await getPayerInfoFromSub(process.env.MP_ACCESS_TOKEN!, subId)
        if (!payerInfo.email && !payerInfo.dni) {
          console.warn('[mp-webhook] no se pudo obtener payer info para sub', subId)
          return NextResponse.json({ ok: true })
        }
        const affiliate = await findPendingAffiliate(supabase, payerInfo)
        if (!affiliate) {
          console.warn('[mp-webhook] no hay affiliate pending para payer', payerInfo, 'sub=', subId)
          return NextResponse.json({ ok: true })
        }
        const affiliateId = affiliate.id

        {
          // scope para conservar la indentación del bloque original de activación
          if (affiliate.status === 'pending') {
          const today = todayAR()

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

          // El trigger de DB genera affiliate_number + farmacia_number al pasar a 'active'.
          // Lo leemos del update para usarlo en los emails.
          const { data: numbered } = await supabase
            .from('affiliates')
            .update({
              status: 'active',
              mp_subscription_id: body.data.id,
              mp_payer_id: payerInfo.payerId,   // payer_id de MP para trazabilidad
              cobertura_desde: today,
              cobertura_hasta: addOneMonth(today),
              updated_at: new Date().toISOString(),
              ...(userId ? { user_id: userId } : {}),
            })
            .eq('id', affiliateId)
            .select('affiliate_number, farmacia_number')
            .single()

          affiliate.affiliate_number = numbered?.affiliate_number ?? affiliate.affiliate_number
          const farmaciaNumber = numbered?.farmacia_number ?? ''

          // Insert payment record for the initial subscription charge.
          // Uses a stable key (sub-{preapproval_id}) so the payment branch can
          // replace it with the real mp_payment_id when that event arrives.
          const placeholderPaymentId = `sub-${body.data.id}`
          const { count: placeholderCount } = await supabase
            .from('payments')
            .select('id', { count: 'exact', head: true })
            .eq('mp_payment_id', placeholderPaymentId)

          if ((placeholderCount ?? 0) === 0) {
            const amount = Math.round(pa.auto_recurring?.transaction_amount ?? 0)
            if (amount > 0) {
              await supabase.from('payments').insert({
                affiliate_id: affiliateId,
                mp_payment_id: placeholderPaymentId,
                mp_status: 'approved',
                amount,
                currency: pa.auto_recurring?.currency_id ?? 'ARS',
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
            whatsapp: affiliate.whatsapp ?? null,
          })

          // Purchase server-side — Meta CAPI + GA4.
          // Claim atómico: UPDATE ... WHERE purchase_event_sent_at IS NULL.
          // Si dos webhooks corren en paralelo, solo uno recibe la fila → solo uno dispara.
          const { data: claimed } = await supabase
            .from('affiliates')
            .update({ purchase_event_sent_at: new Date().toISOString() })
            .eq('id', affiliateId)
            .is('purchase_event_sent_at', null)
            .select('id')
            .maybeSingle()

          if (claimed) {
            // IDs del browser viven en `leads` (capturados en el PATCH del onboarding)
            const { data: tracking } = await supabase
              .from('leads')
              .select('fbp, fbc, ga_client_id, client_user_agent, client_ip')
              .eq('affiliate_id', affiliateId)
              .maybeSingle()

            const purchaseValue = Math.round(pa.auto_recurring?.transaction_amount ?? resolvedPlan?.price ?? 19500)
            const purchaseCurrency = pa.auto_recurring?.currency_id ?? 'ARS'
            const purchasePlanName = resolvedPlan?.name ?? 'Previnca Nexo'

            sendMetaCapiEvents([{
              event_name: 'Purchase',
              event_id: String(body.data.id),
              user_data: {
                email: affiliate.email,
                phone: affiliate.whatsapp,
                firstName: affiliate.nombre,
                lastName: affiliate.apellido,
                dni: affiliate.dni,
                ciudad: affiliate.ciudad ?? undefined,
                externalId: affiliateId,
                fbp: tracking?.fbp ?? undefined,
                fbc: tracking?.fbc ?? undefined,
                clientIp: tracking?.client_ip ?? undefined,
                clientUserAgent: tracking?.client_user_agent ?? undefined,
              },
              custom_data: {
                currency: purchaseCurrency,
                value: purchaseValue,
                content_name: purchasePlanName,
              },
            }]).catch(() => {})

            sendGa4Events({
              clientId: tracking?.ga_client_id ?? null,
              userId: affiliateId,
              events: [{
                name: 'purchase',
                params: {
                  transaction_id: String(body.data.id),
                  value: purchaseValue,
                  currency: purchaseCurrency,
                  items: [{
                    item_id: affiliateId,
                    item_name: purchasePlanName,
                    price: purchaseValue,
                    quantity: 1,
                  }],
                },
              }],
            }).catch(() => {})
          }

          revalidatePath('/admin')
          revalidatePath('/admin/afiliados')
          revalidatePath(`/admin/afiliados/${affiliateId}`)
        }
        }
      }

      // Cancelled or paused by MP → suspend active affiliate.
      // Match por mp_subscription_id (guardado al activar). Si la sub no está
      // registrada en la DB, es una sub fantasma — se ignora.
      if (preApproval.status === 'cancelled' || preApproval.status === 'paused') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, status, nombre, email')
          .eq('mp_subscription_id', subId)
          .maybeSingle()

        if (affiliate?.status === 'active') {
          await supabase
            .from('affiliates')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', affiliate.id)
          await sendSuspensionEmail(affiliate.nombre, affiliate.email)
        } else if (!affiliate) {
          console.warn('[mp-webhook] cancel/pause de sub que no existe en DB (fantasma)', subId)
        }
      }
    }

    if (body.type === 'payment' && body.data?.id) {
      const paymentClient = new Payment(mpClient)
      const payment = await paymentClient.get({ id: Number(body.data.id) })

      const mp = payment as unknown as MPPaymentExt
      if (payment.status === 'approved' && mp.subscription_id) {
        const { count } = await supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('mp_payment_id', String(payment.id))

        if ((count ?? 0) === 0) {
          const preApprovalClient = new PreApproval(mpClient)
          const preApproval = await preApprovalClient.get({ id: mp.subscription_id as string })
          const ppa = preApproval as unknown as MPPreApprovalExt

          // external_reference may be on the subscription or on the plan (PreApprovalPlan flow)
          let paymentAffiliateId = ppa.external_reference || null
          if (!paymentAffiliateId && ppa.preapproval_plan_id) {
            try {
              const planClient = new PreApprovalPlan(mpClient)
              const mpPlan = await planClient.get({ preApprovalPlanId: String(ppa.preapproval_plan_id) })
              paymentAffiliateId = (mpPlan as unknown as MPPlanExt).external_reference || null
            } catch (planErr) {
              console.error('[mp-webhook] payment: could not fetch plan for external_reference:', planErr)
            }
          }
          if (paymentAffiliateId) {
            ppa.external_reference = paymentAffiliateId
          }

          if (ppa.external_reference) {
            const todayStr = todayAR()

            // Remove the preapproval placeholder if it exists, then insert the real payment
            await supabase
              .from('payments')
              .delete()
              .eq('affiliate_id', ppa.external_reference)
              .eq('mp_payment_id', `sub-${mp.subscription_id}`)

            await supabase.from('payments').insert({
              affiliate_id: ppa.external_reference,
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
              .select('status, user_id, nombre, apellido, dni, email, whatsapp, ciudad, affiliate_number, fecha_nacimiento, domicilio, plan:plans(name, price), cobertura_hasta, purchase_event_sent_at, mp_subscription_id')
              .eq('id', ppa.external_reference)
              .single()

            // Activate pending affiliate when first payment is approved
            if (affiliateData?.status === 'pending') {
              const today = todayAR()

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

              const { data: numbered } = await supabase
                .from('affiliates')
                .update({
                  status: 'active',
                  mp_subscription_id: String(mp.subscription_id),
                  cobertura_desde: today,
                  cobertura_hasta: addOneMonth(today),
                  updated_at: new Date().toISOString(),
                  ...(userId ? { user_id: userId } : {}),
                })
                .eq('id', ppa.external_reference)
                .select('affiliate_number, farmacia_number')
                .single()

              affiliateData.affiliate_number = numbered?.affiliate_number ?? affiliateData.affiliate_number
              const farmaciaNumber = numbered?.farmacia_number ?? ''

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
                id: ppa.external_reference,
                nombre: affiliateData.nombre,
                apellido: affiliateData.apellido,
                dni: affiliateData.dni,
                email: affiliateData.email,
                affiliate_number: affiliateData.affiliate_number,
                farmacia_number: farmaciaNumber,
                plan: resolvedPlan,
                fecha_nacimiento: affiliateData.fecha_nacimiento ?? null,
                domicilio: affiliateData.domicilio ?? null,
                whatsapp: affiliateData.whatsapp ?? null,
              })

              // Purchase server-side — Meta CAPI + GA4. Claim atómico (ver rama 'authorized').
              const { data: claimed } = await supabase
                .from('affiliates')
                .update({ purchase_event_sent_at: new Date().toISOString() })
                .eq('id', ppa.external_reference)
                .is('purchase_event_sent_at', null)
                .select('id')
                .maybeSingle()

              if (claimed) {
                // IDs del browser viven en `leads` (capturados en el PATCH del onboarding)
                const { data: tracking } = await supabase
                  .from('leads')
                  .select('fbp, fbc, ga_client_id, client_user_agent, client_ip')
                  .eq('affiliate_id', ppa.external_reference)
                  .maybeSingle()

                const purchaseValue = Math.round(payment.transaction_amount ?? resolvedPlan?.price ?? 19500)
                const purchaseCurrency = payment.currency_id ?? 'ARS'
                const purchasePlanName = resolvedPlan?.name ?? 'Previnca Nexo'

                sendMetaCapiEvents([{
                  event_name: 'Purchase',
                  event_id: String(mp.subscription_id),
                  user_data: {
                    email: affiliateData.email,
                    phone: affiliateData.whatsapp,
                    firstName: affiliateData.nombre,
                    lastName: affiliateData.apellido,
                    dni: affiliateData.dni,
                    ciudad: affiliateData.ciudad ?? undefined,
                    externalId: ppa.external_reference,
                    fbp: tracking?.fbp ?? undefined,
                    fbc: tracking?.fbc ?? undefined,
                    clientIp: tracking?.client_ip ?? undefined,
                    clientUserAgent: tracking?.client_user_agent ?? undefined,
                  },
                  custom_data: {
                    currency: purchaseCurrency,
                    value: purchaseValue,
                    content_name: purchasePlanName,
                  },
                }]).catch(() => {})

                sendGa4Events({
                  clientId: tracking?.ga_client_id ?? null,
                  userId: ppa.external_reference,
                  events: [{
                    name: 'purchase',
                    params: {
                      transaction_id: String(mp.subscription_id),
                      value: purchaseValue,
                      currency: purchaseCurrency,
                      items: [{
                        item_id: ppa.external_reference,
                        item_name: purchasePlanName,
                        price: purchaseValue,
                        quantity: 1,
                      }],
                    },
                  }],
                }).catch(() => {})
              }

              revalidatePath('/admin')
              revalidatePath('/admin/afiliados')
              revalidatePath(`/admin/afiliados/${ppa.external_reference}`)
            } else if (affiliateData?.mp_subscription_id !== String(mp.subscription_id)) {
              // Cobro fantasma — viene de una sub ajena con el mismo external_reference
              // (URL hijacking). NO extender cobertura ni notificar — la sub que cobró
              // pertenece a otro usuario. La plata entró pero no se atribuye a este affiliate.
              console.warn('[mp-webhook] ghost payment ignored — sub_id mismatch', {
                affiliate_id: ppa.external_reference,
                received_sub_id: mp.subscription_id,
                real_sub_id: affiliateData?.mp_subscription_id,
                payment_id: payment.id,
              })
            } else {
              // Already active — extend cobertura_hasta from the later of today or current cobertura_hasta
              const hoy = todayAR()
              const baseDate = affiliateData?.cobertura_hasta && affiliateData.cobertura_hasta > hoy
                ? affiliateData.cobertura_hasta
                : hoy
              await supabase
                .from('affiliates')
                .update({
                  cobertura_hasta: addOneMonth(baseDate),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', ppa.external_reference)

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

      if (payment.status === 'rejected') {
        // Resolver el afiliado igual que el flujo aprobado: subscription → external_reference.
        let rejAffiliateId: string | null = null
        if (mp.subscription_id) {
          try {
            const preApprovalClient = new PreApproval(mpClient)
            const pre = await preApprovalClient.get({ id: mp.subscription_id as string })
            const preExt = pre as unknown as MPPreApprovalExt
            rejAffiliateId = preExt.external_reference || null
            if (!rejAffiliateId && preExt.preapproval_plan_id) {
              const planClient = new PreApprovalPlan(mpClient)
              const mpPlan = await planClient.get({ preApprovalPlanId: String(preExt.preapproval_plan_id) })
              rejAffiliateId = (mpPlan as unknown as MPPlanExt).external_reference || null
            }
          } catch (rejErr) {
            console.error('[mp-webhook] rejected: no se pudo resolver el afiliado:', rejErr)
          }
        }

        if (rejAffiliateId) {
          // Claim atómico: UPDATE ... WHERE status='pending' AND rejection_notified_at IS NULL.
          // Solo el primer webhook concurrente que gane el claim envía los emails.
          const { data: aff } = await supabase
            .from('affiliates')
            .update({ rejection_notified_at: new Date().toISOString() })
            .eq('id', rejAffiliateId)
            .eq('status', 'pending')
            .is('rejection_notified_at', null)
            .select('id, nombre, apellido, dni, email, whatsapp, checkout_url')
            .maybeSingle()

          if (aff) {
            await sendPaymentRejectedEmail({
              nombre: aff.nombre,
              email: aff.email,
              checkoutUrl: aff.checkout_url ?? null,
            })
            await sendInternalPaymentRejectedEmail({
              nombre: aff.nombre,
              apellido: aff.apellido,
              email: aff.email,
              whatsapp: aff.whatsapp ?? null,
              dni: aff.dni ?? null,
              affiliateId: aff.id,
            })
          }
        }
      }
    }
  } catch (err) {
    console.error('[mp-webhook]', err)
  }

  return NextResponse.json({ ok: true })
}
