'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendActivationEmail, sendCredentialsEmail, sendInternalNewMemberEmail, sendPaymentConfirmedEmail, sendResubscribeEmail, sendSuspensionEmail, sendCancellationEmail, sendPasswordResetEmail } from '@/lib/emails'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import type { AffiliateStatus } from '@/lib/types'

async function requireAdmin(): Promise<{ authorized: true } | { authorized: false; error: { success: false; message: string } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (!user?.email || !adminEmails.includes(user.email)) {
    return { authorized: false, error: { success: false, message: 'No autorizado.' } }
  }
  return { authorized: true }
}

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

function addOneMonth(dateStr: string | null): string {
  const base = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const year = base.getFullYear()
  const month = base.getMonth() + 1
  const day = base.getDate()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export async function updateAffiliateStatus(
  affiliateId: string,
  status: AffiliateStatus,
  coberturaDesde?: string,
  coberturaHasta?: string,
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('affiliates')
    .select('status, nombre, apellido, dni, email, affiliate_number, farmacia_number, mp_subscription_id, fecha_nacimiento, domicilio, plan:plans(id, name, price)')
    .eq('id', affiliateId)
    .single()

  if (coberturaDesde && coberturaHasta && coberturaDesde >= coberturaHasta) {
    return { success: false, message: 'La fecha de inicio debe ser anterior a la fecha de fin.' }
  }

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
      fecha_nacimiento: (current as any).fecha_nacimiento ?? null,
      domicilio: (current as any).domicilio ?? null,
    })
  }

  if (
    (status === 'suspended' || status === 'cancelled') &&
    current?.status !== status &&
    (current as any)?.mp_subscription_id
  ) {
    await cancelMpSubscription((current as any).mp_subscription_id)
  }

  if ((status === 'suspended' || status === 'cancelled') && current?.status !== status && current) {
    if (status === 'suspended') {
      await sendSuspensionEmail(current.nombre, current.email)
    } else {
      await sendCancellationEmail(current.nombre, current.email)
    }
  }

  // Reactivating a previously suspended affiliate: create a new MP subscription
  // so they can resume monthly charges, and notify them via email
  let mpReactivationWarning: string | null = null
  if (status === 'active' && current?.status === 'suspended' && process.env.MP_ACCESS_TOKEN) {
    const rawPlan = (current as any).plan
    const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    try {
      const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
      const preApprovalClient = new PreApproval(mpClient)
      const mpResponse = await preApprovalClient.create({
        body: {
          reason: plan?.name ?? 'Previnca Nexo',
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
      } else {
        mpReactivationWarning = 'Estado actualizado, pero MercadoPago no devolvió el link de pago. El afiliado deberá suscribirse manualmente.'
      }
    } catch (err) {
      console.error('[admin] MP reactivation preapproval error:', err)
      mpReactivationWarning = 'Estado actualizado, pero no se pudo crear la nueva suscripción en Mercado Pago. Revisá manualmente.'
    }
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)
  revalidatePath('/admin/afiliados')

  return { success: true, message: mpReactivationWarning ?? 'Estado actualizado correctamente.' }
}

export async function updateAffiliateData(affiliateId: string, formData: FormData) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

  const supabase = createAdminClient()

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  const textFields = ['nombre', 'apellido', 'whatsapp', 'ciudad', 'domicilio'] as const
  for (const field of textFields) {
    const value = (formData.get(field) as string | null)?.trim() ?? ''
    payload[field] = value || null
  }

  if (!payload.nombre || !payload.apellido) {
    return { success: false, message: 'El nombre y apellido son obligatorios.' }
  }

  const fechaNacimiento = (formData.get('fecha_nacimiento') as string | null)?.trim() ?? ''
  payload.fecha_nacimiento = fechaNacimiento || null

  const planId = (formData.get('plan_id') as string | null)?.trim() ?? ''
  payload.plan_id = planId || null

  const newEmail = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  if (newEmail) {
    const { data: currentAffiliate } = await supabase
      .from('affiliates')
      .select('email, user_id')
      .eq('id', affiliateId)
      .single()

    if (currentAffiliate && currentAffiliate.email !== newEmail) {
      if (currentAffiliate.user_id) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          currentAffiliate.user_id,
          { email: newEmail, email_confirm: true },
        )
        if (authError) {
          return { success: false, message: `Error al actualizar email: ${authError.message}` }
        }
      }
      payload.email = newEmail
    }
  }

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
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

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
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

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
    .select('status, nombre, apellido, dni, email, affiliate_number, farmacia_number, cobertura_hasta, user_id, plan:plans(name)')
    .eq('id', affiliateId)
    .single()

  const paidAtRaw = (formData.get('paid_at') as string | null)?.trim()
  const paidAt = paidAtRaw
    ? (paidAtRaw.includes('T') ? new Date(paidAtRaw) : new Date(paidAtRaw + 'T12:00:00'))
    : new Date()
  const today = paidAt

  const todayDateStr = today.toISOString().split('T')[0]
  const { error } = await supabase.from('payments').insert({
    affiliate_id: affiliateId,
    amount: Math.round(amount),
    currency,
    mp_status: paymentStatus,
    mp_payment_id,
    paid_at: today.toISOString(),
    period_from: todayDateStr,
    period_to: addOneMonth(todayDateStr),
  })

  if (error) {
    return { success: false, message: error.message }
  }

  // Si el pago es aprobado y el afiliado está pendiente → activar automáticamente
  if (paymentStatus === 'approved' && affiliate?.status === 'pending') {
    const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan
    const farmaciaNumber = (affiliate as any).farmacia_number
      ?? `289${parseInt(affiliate.affiliate_number ?? '0', 10).toString().padStart(8, '0')}0000`

    // Create Auth user if one doesn't exist yet
    let tempPassword: string | undefined
    if (!(affiliate as any).user_id) {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      const bytes = randomBytes(12)
      tempPassword = Array.from(bytes).map(b => chars[b % chars.length]).join('')
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: affiliate.email,
        password: tempPassword,
        email_confirm: true,
      })
      if (!authError && authData?.user) {
        await supabase.from('affiliates').update({ user_id: authData.user.id }).eq('id', affiliateId)
      } else if (authError) {
        console.error('[addPayment] createUser error:', authError)
        tempPassword = undefined
      }
    }

    const { error: activationError } = await supabase
      .from('affiliates')
      .update({
        status: 'active',
        farmacia_number: farmaciaNumber,
        cobertura_desde: todayDateStr,
        cobertura_hasta: addOneMonth(todayDateStr),
        updated_at: today.toISOString(),
      })
      .eq('id', affiliateId)

    if (activationError) {
      return { success: false, message: `Pago registrado pero error al activar al afiliado: ${activationError.message}` }
    }

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
      apellido: (affiliate as any).apellido ?? '',
      dni: (affiliate as any).dni ?? '',
      email: affiliate.email,
      affiliate_number: affiliate.affiliate_number,
      farmacia_number: farmaciaNumber,
      plan: resolvedPlan,
      fecha_nacimiento: (affiliate as any).fecha_nacimiento ?? null,
      domicilio: (affiliate as any).domicilio ?? null,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/afiliados')
    revalidatePath(`/admin/afiliados/${affiliateId}`)

    return { success: true, message: 'Pago registrado. Afiliado activado automáticamente.' }
  }

  // Afiliado ya activo → extender cobertura_hasta un mes
  if (paymentStatus === 'approved' && affiliate?.status === 'active') {
    const newCobertura = addOneMonth((affiliate as any).cobertura_hasta ?? null)

    await supabase
      .from('affiliates')
      .update({
        cobertura_hasta: newCobertura,
        updated_at: today.toISOString(),
      })
      .eq('id', affiliateId)

    await sendPaymentConfirmedEmail(affiliate.nombre, affiliate.email, amount, currency)

    revalidatePath('/admin')
    revalidatePath('/admin/afiliados')
    revalidatePath(`/admin/afiliados/${affiliateId}`)

    return { success: true, message: `Pago registrado. Cobertura extendida hasta ${newCobertura}.` }
  }

  // Afiliado suspendido o cancelado → reactivar automáticamente
  if (paymentStatus === 'approved' && (affiliate?.status === 'suspended' || affiliate?.status === 'cancelled')) {
    const hoy = todayDateStr
    const base = (affiliate as any).cobertura_hasta && (affiliate as any).cobertura_hasta > hoy
      ? (affiliate as any).cobertura_hasta
      : hoy
    const newCobertura = addOneMonth(base)
    const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan
    const farmaciaNumber = (affiliate as any).farmacia_number
      ?? `289${parseInt(affiliate.affiliate_number ?? '0', 10).toString().padStart(8, '0')}0000`

    await supabase
      .from('affiliates')
      .update({
        status: 'active',
        cobertura_hasta: newCobertura,
        updated_at: today.toISOString(),
      })
      .eq('id', affiliateId)

    await sendActivationEmail({
      nombre: affiliate.nombre,
      email: affiliate.email,
      affiliate_number: affiliate.affiliate_number,
      farmacia_number: farmaciaNumber,
      plan: resolvedPlan,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/afiliados')
    revalidatePath(`/admin/afiliados/${affiliateId}`)

    return { success: true, message: 'Pago registrado. Afiliado reactivado automáticamente.' }
  }

  // Notificar al afiliado si el pago fue aprobado
  if (paymentStatus === 'approved' && affiliate) {
    await sendPaymentConfirmedEmail(affiliate.nombre, affiliate.email, amount, currency)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true, message: 'Pago registrado correctamente.' }
}

export async function deleteAffiliate(affiliateId: string): Promise<{ success: boolean; message: string }> {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

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
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(affiliate.user_id)
    if (authDeleteError) {
      console.error('[deleteAffiliate] Failed to delete auth user:', authDeleteError)
      // Non-fatal: the affiliate DB record is deleted, log for manual cleanup
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  return { success: true, message: 'Afiliado eliminado correctamente.' }
}

export async function deletePayment(paymentId: string): Promise<{ success: boolean; message: string }> {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

  const supabase = createAdminClient()

  // Fetch affiliate_id before deleting so we can revalidate the right paths
  const { data: payment } = await supabase
    .from('payments')
    .select('affiliate_id')
    .eq('id', paymentId)
    .single()

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/pagos')
  if (payment?.affiliate_id) {
    revalidatePath(`/admin/afiliados/${payment.affiliate_id}`)
  }

  return { success: true, message: 'Pago eliminado.' }
}

export async function sendAffiliatePasswordReset(affiliateId: string): Promise<{ success: boolean; message: string }> {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, email')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) return { success: false, message: 'Afiliado no encontrado.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: affiliate.email,
    options: { redirectTo: `${appUrl}/portal` },
  })

  if (error || !data?.properties?.action_link) {
    return { success: false, message: error?.message ?? 'No se pudo generar el link de recuperación.' }
  }

  await sendPasswordResetEmail(affiliate.nombre, affiliate.email, data.properties.action_link)

  return { success: true, message: `Email de restablecimiento enviado a ${affiliate.email}.` }
}
