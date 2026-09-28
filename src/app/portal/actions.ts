'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago'
import { buildCopaymentBody, sendCopaymentConsumption, COPAYMENT_PRODUCT_CODES } from '@/lib/salesforce/copayments'

type RetryResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string }

export async function retryPayment(): Promise<RetryResult> {
  if (!process.env.MP_ACCESS_TOKEN) {
    return { success: false, error: 'El sistema de pagos no está configurado.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, email, status, mp_subscription_id, plan:plans(id, name, price)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) return { success: false, error: 'Afiliado no encontrado.' }
  if (affiliate.status !== 'pending') {
    return { success: false, error: 'La cuenta no está en estado pendiente.' }
  }

  const rawPlan = affiliate.plan as any
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan

  const headersList = await headers()
  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  const host = headersList.get('host') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${host}`

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })

  try {
    const planClient = new PreApprovalPlan(mpClient)
    const mpPlan = await planClient.create({
      body: {
        reason: plan?.name ?? 'Previnca Nexo',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/registro/exito`,
        external_reference: affiliate.id,
      } as any,
    })

    if (!mpPlan.init_point) {
      throw new Error('MP no devolvió URL de pago')
    }

    if (mpPlan.id) {
      await admin
        .from('affiliates')
        .update({ mp_subscription_id: String(mpPlan.id) })
        .eq('id', affiliate.id)
    }

    return { success: true, checkoutUrl: mpPlan.init_point }
  } catch (err: any) {
    const msg = err?.message ?? err?.cause?.message ?? JSON.stringify(err)
    console.error('[retry-payment]', msg, err)
    return { success: false, error: `Error MP: ${msg}` }
  }
}

// Registro best-effort del interés en Psicología On Demand.
// No debe interrumpir la redirección: si falla, solo loguea.
export async function registerPsicologiaClick(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, sf_account_id')
      .eq('user_id', user.id)
      .single()

    await admin.from('psicologia_clicks').insert({
      affiliate_id: affiliate?.id ?? null,
    })

    // Dispara /copayments a SF si la cuenta tiene sf_account_id.
    // Best-effort: si SF rechaza, no interrumpe el redirect al proveedor
    // externo. El log queda en sf_messages para auditoría.
    if (affiliate?.id && affiliate?.sf_account_id) {
      const payload = buildCopaymentBody({
        accountId: affiliate.sf_account_id,
        productCode: COPAYMENT_PRODUCT_CODES.psicologia,
        quantity: 1,
        consumedOn: new Date().toISOString().slice(0, 10),
      })
      await sendCopaymentConsumption({ affiliateId: affiliate.id, payload })
    }
  } catch (err) {
    console.error('[psicologia-click]', err)
  }
}

// Registro best-effort de la solicitud de Seguro de Hogar. No interrumpe la redirección.
export async function registerSeguroHogarSolicitud(
  plan: 'hasta_1er_piso' | 'segundo_piso_plus',
): Promise<void> {
  try {
    if (plan !== 'hasta_1er_piso' && plan !== 'segundo_piso_plus') return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, sf_account_id')
      .eq('user_id', user.id)
      .single()

    await admin.from('seguro_hogar_solicitudes').insert({
      affiliate_id: affiliate?.id ?? null,
      plan,
    })

    // Dispara /copayments a SF si la cuenta tiene sf_account_id.
    // Best-effort: no interrumpe el redirect al proveedor.
    if (affiliate?.id && affiliate?.sf_account_id) {
      const payload = buildCopaymentBody({
        accountId: affiliate.sf_account_id,
        productCode: COPAYMENT_PRODUCT_CODES.seguro_hogar,
        quantity: 1,
        consumedOn: new Date().toISOString().slice(0, 10),
      })
      await sendCopaymentConsumption({ affiliateId: affiliate.id, payload })
    }
  } catch (err) {
    console.error('[seguro-hogar-solicitud]', err)
  }
}
