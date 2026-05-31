'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendInternalNewMemberEmail, sendPaymentConfirmedEmail, sendResubscribeEmail } from '@/lib/emails'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import type { AffiliateStatus } from '@/lib/types'

async function cancelMpSubscription(subscriptionId: string): Promise<void> {
  if (!process.env.MP_ACCESS_TOKEN) return
  try {
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preApprovalClient = new PreApproval(mpClient)
    await preApprovalClient.update({ id: subscriptionId, body: { status: 'cancelled' } })
  } catch (err) {
    console.error('[admin] MP subscription cancel error:', err)
  }
}

export async function updateAffiliateStatus(
  affiliateId: string,
  status: AffiliateStatus,
  coberturaDesde?: string,
  coberturaHasta?: string,
) {
  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('affiliates')
    .select('status, nombre, apellido, dni, email, affiliate_number, farmacia_number, mp_subscription_id, plan:plans(id, name, price)')
    .eq('id', affiliateId)
    .single()

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Empty string means "clear the field"; undefined means "leave it unchanged"
  if (coberturaDesde !== undefined) {
    payload.cobertura_desde = coberturaDesde.trim() === '' ? null : coberturaDesde.trim()
  }
  if (coberturaHasta !== undefined) {
    payload.cobertura_hasta = coberturaHasta.trim() === '' ? null : coberturaHasta.trim()
  }

  const { error } = await supabase
    .from('affiliates')
    .update(payload)
    .eq('id', affiliateId)

  if (error) {
    return { success: false, message: error.message }
  }

  if (status === 'active' && current?.status !== 'active' && current) {
    const resolvedPlan = Array.isArray(current.plan) ? (current.plan[0] ?? null) : current.plan
    const farmaciaNumber = (current as any).farmacia_number
      ?? `289${parseInt(current.affiliate_number ?? '0', 10).toString().padStart(8, '0')}0000`

    await sendActivationEmail({
      nombre: current.nombre,
      email: current.email,
      affiliate_number: current.affiliate_number,
      farmacia_number: farmaciaNumber,
      plan: resolvedPlan,
    })

    await sendInternalNewMemberEmail({
      id: affiliateId,
      nombre: current.nombre,
      apellido: (current as any).apellido ?? '',
      dni: (current as any).dni ?? '',
      email: current.email,
      affiliate_number: current.affiliate_number,
      farmacia_number: farmaciaNumber,
      plan: resolvedPlan,
    })
  }

  if (
    (status === 'suspended' || status === 'cancelled') &&
    current?.status !== status &&
    (current as any)?.mp_subscription_id
  ) {
    await cancelMpSubscription((current as any).mp_subscription_id)
  }

  // Reactivating a previously suspended affiliate: create a new MP subscription
  // so they can resume monthly charges, and notify them via email
  if (status === 'active' && current?.status === 'suspended' && process.env.MP_ACCESS_TOKEN) {
    const rawPlan = (current as any).plan
    const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    try {
      const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
      const preApprovalClient = new PreApproval(mpClient)
      const mpResponse = await preApprovalClient.create({
        body: {
          reason: plan?.name ?? 'Nexo by Previnca',
          back_url: `${appUrl}/portal`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan?.price ?? 19500,
            currency_id: 'ARS',
          },
          external_reference: affiliateId,
          status: 'pending',
        },
      })
      if (mpResponse.id) {
        await supabase
          .from('affiliates')
          .update({ mp_subscription_id: String(mpResponse.id) })
          .eq('id', affiliateId)
      }
      if (mpResponse.init_point) {
        await sendResubscribeEmail(current.nombre, current.email, mpResponse.init_point)
      }
    } catch (err) {
      console.error('[admin] MP reactivation preapproval error:', err)
    }
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)
  revalidatePath('/admin/afiliados')

  return { success: true, message: 'Estado actualizado correctamente.' }
}

export async function updateAffiliateData(affiliateId: string, formData: FormData) {
  const supabase = createAdminClient()

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  const textFields = ['nombre', 'apellido', 'whatsapp', 'ciudad', 'domicilio'] as const
  for (const field of textFields) {
    const value = (formData.get(field) as string | null)?.trim() ?? ''
    payload[field] = value || null
  }

  const fechaNacimiento = (formData.get('fecha_nacimiento') as string | null)?.trim() ?? ''
  payload.fecha_nacimiento = fechaNacimiento || null

  const planId = (formData.get('plan_id') as string | null)?.trim() ?? ''
  payload.plan_id = planId || null

  const { error } = await supabase
    .from('affiliates')
    .update(payload)
    .eq('id', affiliateId)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)
  revalidatePath('/admin/afiliados')

  return { success: true, message: 'Datos actualizados correctamente.' }
}

export async function updateAffiliateNotes(affiliateId: string, notes: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('affiliates')
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', affiliateId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/admin/afiliados/${affiliateId}`)
  return { success: true, message: 'Notas guardadas.' }
}

export async function addPayment(affiliateId: string, formData: FormData) {
  const supabase = createAdminClient()

  const rawAmount = formData.get('amount') as string
  const amount = parseFloat(rawAmount)

  if (!rawAmount || isNaN(amount) || amount <= 0) {
    return { success: false, message: 'El monto debe ser un número mayor a 0.' }
  }

  const currency = (formData.get('currency') as string) || 'ARS'
  const paymentStatus = (formData.get('status') as string) || 'approved'
  const mp_payment_id = (formData.get('external_id') as string)?.trim() || null

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('status, nombre, apellido, dni, email, affiliate_number, farmacia_number, plan:plans(name)')
    .eq('id', affiliateId)
    .single()

  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const { error } = await supabase.from('payments').insert({
    affiliate_id: affiliateId,
    amount: Math.round(amount),
    currency,
    mp_status: paymentStatus,
    mp_payment_id,
    paid_at: today.toISOString(),
    period_from: today.toISOString().split('T')[0],
    period_to: nextMonth.toISOString().split('T')[0],
  })

  if (error) {
    return { success: false, message: error.message }
  }

  // Si el pago es aprobado y el afiliado está pendiente → activar automáticamente
  if (paymentStatus === 'approved' && affiliate?.status === 'pending') {
    await supabase
      .from('affiliates')
      .update({
        status: 'active',
        cobertura_desde: today.toISOString().split('T')[0],
        cobertura_hasta: nextMonth.toISOString().split('T')[0],
        updated_at: today.toISOString(),
      })
      .eq('id', affiliateId)

    const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan
    const farmaciaNumber = (affiliate as any).farmacia_number
      ?? `289${parseInt(affiliate.affiliate_number ?? '0', 10).toString().padStart(8, '0')}0000`

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
      apellido: (affiliate as any).apellido ?? '',
      dni: (affiliate as any).dni ?? '',
      email: affiliate.email,
      affiliate_number: affiliate.affiliate_number,
      farmacia_number: farmaciaNumber,
      plan: resolvedPlan,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/afiliados')
    revalidatePath(`/admin/afiliados/${affiliateId}`)

    return { success: true, message: 'Pago registrado. Afiliado activado automáticamente.' }
  }

  // Notificar al afiliado si el pago fue aprobado
  if (paymentStatus === 'approved' && affiliate) {
    await sendPaymentConfirmedEmail(affiliate.nombre, affiliate.email, amount, currency)
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true, message: 'Pago registrado correctamente.' }
}

export async function deleteAffiliate(affiliateId: string): Promise<{ success: false; message: string } | never> {
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('user_id, mp_subscription_id')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) return { success: false, message: 'Afiliado no encontrado.' }

  // Cancel MP subscription if exists
  if (affiliate.mp_subscription_id && process.env.MP_ACCESS_TOKEN) {
    try {
      const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
      const preApprovalClient = new PreApproval(mpClient)
      await preApprovalClient.update({ id: affiliate.mp_subscription_id, body: { status: 'cancelled' } })
    } catch (err) {
      console.error('[admin] MP cancel on delete error:', err)
    }
  }

  // Delete affiliate record (payments cascade via FK)
  const { error } = await supabase.from('affiliates').delete().eq('id', affiliateId)
  if (error) return { success: false, message: error.message }

  // Delete auth user
  if (affiliate.user_id) {
    await supabase.auth.admin.deleteUser(affiliate.user_id)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  redirect('/admin/afiliados')
}
