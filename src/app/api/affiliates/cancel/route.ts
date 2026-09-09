import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { NextResponse } from 'next/server'

export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('mp_subscription_id')
      .eq('user_id', user.id)
      .single()

    // Cancel in MP first (best-effort — don't block on failure)
    const mpSubscriptionId = (affiliate as any)?.mp_subscription_id as string | null | undefined
    if (mpSubscriptionId && process.env.MP_ACCESS_TOKEN) {
      try {
        const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
        const preApprovalClient = new PreApproval(mpClient)
        await preApprovalClient.update({ id: mpSubscriptionId, body: { status: 'cancelled' } })
      } catch (err) {
        console.error('[cancel] MP cancellation error:', err)
      }
    }

    // No tocamos `status` ni cerramos sesión: la cobertura ya pagada sigue
    // vigente hasta `cobertura_hasta` y el usuario mantiene acceso al portal.
    // Marcamos `cancel_requested_at` para saber que hay cancelación pendiente
    // (banner suave, ocultar botón de cancelar).
    await admin
      .from('affiliates')
      .update({ cancel_requested_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel] Unexpected error:', err)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
