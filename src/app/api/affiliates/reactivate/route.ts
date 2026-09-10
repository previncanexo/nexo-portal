import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Reactivación transparente para el usuario. El flujo:
 *   1. Si la sub actual está `paused` en MP → PUT status='authorized' y volvemos
 *      al portal sin pasar por checkout.
 *   2. Si está `cancelled` (o cualquier otro estado terminal) → creamos una
 *      nueva PreApproval con external_reference = affiliate.id y devolvemos su
 *      init_point. El webhook, al recibir el `authorized`, va a reconectar la
 *      nueva sub al afiliado existente (mismo número, farmacia, user_id).
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const mpToken = process.env.MP_ACCESS_TOKEN
    if (!mpToken) {
      return NextResponse.json({ error: 'Sistema de pagos no configurado.' }, { status: 500 })
    }

    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, nombre, email, mp_subscription_id, plan:plans(id, name, price)')
      .eq('user_id', user.id)
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: 'No encontramos tu afiliación.' }, { status: 404 })
    }

    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const preApprovalClient = new PreApproval(mpClient)

    // 1) Chequear si la sub actual se puede reactivar (solo aplica a `paused`).
    const currentSubId = (affiliate as { mp_subscription_id: string | null }).mp_subscription_id
    if (currentSubId) {
      try {
        const current = await preApprovalClient.get({ id: currentSubId })
        const currentStatus = (current as { status?: string }).status
        if (currentStatus === 'paused') {
          await preApprovalClient.update({ id: currentSubId, body: { status: 'authorized' } })
          await admin
            .from('affiliates')
            .update({ cancel_requested_at: null, updated_at: new Date().toISOString() })
            .eq('id', affiliate.id)
          return NextResponse.json({ checkoutUrl: '/portal', reactivated: true })
        }
      } catch (err) {
        console.error('[reactivate] error chequeando sub actual (sigo al alta nueva):', err)
      }
    }

    // 2) Crear nueva PreApproval — la sub vieja quedó cancelled y MP no permite
    //    volverla a authorized. `external_reference` apunta al affiliate para
    //    que el webhook reconecte los datos existentes al confirmar el pago.
    const plan = Array.isArray(affiliate.plan) ? affiliate.plan[0] : affiliate.plan
    const price = plan?.price ?? 19500
    const planName = plan?.name ?? 'Previnca Nexo'

    const headersList = await headers()
    const proto = headersList.get('x-forwarded-proto') ?? 'https'
    const host = headersList.get('host') ?? ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${host}`

    const sub = await preApprovalClient.create({
      body: {
        reason: planName,
        external_reference: affiliate.id,
        payer_email: affiliate.email,
        back_url: `${appUrl}/portal`,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'ARS',
        },
      },
    })
    const subExt = sub as unknown as { id?: string; init_point?: string }
    const checkoutUrl = subExt.init_point
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'MP no devolvió URL de pago.' }, { status: 500 })
    }

    // Persistir el nuevo sub_id + checkout_url. El webhook va a confirmar el
    // authorized y va a limpiar cancel_requested_at + extender cobertura.
    await admin
      .from('affiliates')
      .update({
        mp_subscription_id: subExt.id ? String(subExt.id) : null,
        checkout_url: checkoutUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', affiliate.id)

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('[reactivate] Unexpected error:', err)
    return NextResponse.json({ error: 'Error inesperado al reactivar.' }, { status: 500 })
  }
}
