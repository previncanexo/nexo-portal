import type { createAdminClient } from '@/lib/supabase/admin'
import { addOneMonth, todayAR } from '@/lib/dateUtils'

interface AffiliateForSync {
  id: string
  mp_subscription_id: string | null
  cobertura_hasta: string | null
}

interface MpAuthorizedPayment {
  payment?: { id?: number | string; status?: string }
  transaction_amount?: number
  currency_id?: string
  date_created?: string
}

/**
 * Cubre webhooks de renovación perdidos: consulta MP por los authorized_payments
 * de la sub, inserta los aprobados que aún no están en `payments` y extiende
 * `cobertura_hasta` en +1 mes por cada pago nuevo (mismo criterio que el webhook).
 *
 * Debe llamarse SOLO cuando el afiliado aparece sin cobertura vigente — cuesta
 * un roundtrip a MP y no aporta si la cobertura ya está OK.
 */
export async function syncMpPaymentsForAffiliate(
  supabase: ReturnType<typeof createAdminClient>,
  affiliate: AffiliateForSync,
): Promise<{ synced: number; newCobertura: string | null }> {
  const mpToken = process.env.MP_ACCESS_TOKEN
  if (!mpToken || !affiliate.mp_subscription_id) {
    return { synced: 0, newCobertura: affiliate.cobertura_hasta }
  }

  try {
    const res = await fetch(
      `https://api.mercadopago.com/authorized_payments/search?preapproval_id=${affiliate.mp_subscription_id}`,
      { headers: { Authorization: `Bearer ${mpToken}` }, cache: 'no-store' },
    )
    if (!res.ok) return { synced: 0, newCobertura: affiliate.cobertura_hasta }

    const data = (await res.json()) as { results?: MpAuthorizedPayment[] }
    const results = data.results ?? []

    // Ordenar cronologicamente para extender cobertura en el mismo orden que
    // cobró MP (si hay 2 pagos perdidos, primero jul → después ago).
    const approved = results
      .filter((r) => r.payment?.status === 'approved' && r.payment.id)
      .sort((a, b) => (a.date_created ?? '').localeCompare(b.date_created ?? ''))

    if (approved.length === 0) return { synced: 0, newCobertura: affiliate.cobertura_hasta }

    const mpPaymentIds = approved.map((r) => String(r.payment!.id))
    const { data: existing } = await supabase
      .from('payments')
      .select('mp_payment_id')
      .in('mp_payment_id', mpPaymentIds)
    const existingSet = new Set((existing ?? []).map((p) => p.mp_payment_id as string))
    const missing = approved.filter((r) => !existingSet.has(String(r.payment!.id)))

    if (missing.length === 0) return { synced: 0, newCobertura: affiliate.cobertura_hasta }

    let currentCobertura = affiliate.cobertura_hasta
    let syncedCount = 0

    for (const auth of missing) {
      const today = todayAR()
      const baseDate = currentCobertura && currentCobertura > today ? currentCobertura : today
      const newPeriodTo = addOneMonth(baseDate)

      const { error: insertError } = await supabase.from('payments').insert({
        affiliate_id: affiliate.id,
        mp_payment_id: String(auth.payment!.id),
        mp_status: 'approved',
        amount: Math.round(auth.transaction_amount ?? 0),
        currency: auth.currency_id ?? 'ARS',
        paid_at: auth.date_created ?? new Date().toISOString(),
        period_from: baseDate,
        period_to: newPeriodTo,
      })
      if (insertError) {
        console.error('[mpSync] insert payment error:', insertError.message)
        continue
      }

      currentCobertura = newPeriodTo
      syncedCount += 1
    }

    if (syncedCount > 0 && currentCobertura !== affiliate.cobertura_hasta) {
      await supabase
        .from('affiliates')
        .update({ cobertura_hasta: currentCobertura, updated_at: new Date().toISOString() })
        .eq('id', affiliate.id)
    }

    return { synced: syncedCount, newCobertura: currentCobertura }
  } catch (err) {
    console.error('[mpSync] unexpected error:', err)
    return { synced: 0, newCobertura: affiliate.cobertura_hasta }
  }
}
