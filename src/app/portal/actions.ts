'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

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
  const preApprovalClient = new PreApproval(mpClient)

  // Cancel previous pending subscription to avoid orphaned preapprovals in MP
  const oldSubscriptionId = (affiliate as any).mp_subscription_id as string | null | undefined
  if (oldSubscriptionId) {
    try {
      await preApprovalClient.update({ id: oldSubscriptionId, body: { status: 'cancelled' } })
    } catch (err) {
      console.error('[retry-payment] Cancel old preapproval error:', err)
    }
  }

  try {
    const mpResponse = await preApprovalClient.create({
      body: {
        reason: plan?.name ?? 'Nexo by Previnca',
        payer_email: `pago${affiliate.id.replace(/-/g, '')}@previncasalud.com.ar`,
        back_url: `${appUrl}/registro/exito`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        external_reference: affiliate.id,
        status: 'pending',
      },
    })

    if (!mpResponse.init_point) {
      throw new Error('MP no devolvió URL de pago')
    }

    if (mpResponse.id) {
      await admin
        .from('affiliates')
        .update({ mp_subscription_id: String(mpResponse.id) })
        .eq('id', affiliate.id)
    }

    return { success: true, checkoutUrl: mpResponse.init_point }
  } catch (err: any) {
    const msg = err?.message ?? err?.cause?.message ?? JSON.stringify(err)
    console.error('[retry-payment]', msg, err)
    return { success: false, error: `Error MP: ${msg}` }
  }
}
