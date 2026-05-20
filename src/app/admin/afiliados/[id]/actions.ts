'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail } from '@/lib/emails'
import type { AffiliateStatus } from '@/lib/types'

export async function updateAffiliateStatus(
  affiliateId: string,
  status: AffiliateStatus,
  coberturaDesde?: string,
  coberturaHasta?: string,
) {
  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('affiliates')
    .select('status, nombre, email, affiliate_number, plan:plans(name)')
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
    await sendActivationEmail({
      nombre: current.nombre,
      email: current.email,
      affiliate_number: current.affiliate_number,
      plan: Array.isArray(current.plan) ? (current.plan[0] ?? null) : current.plan,
    })
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

  const textFields = ['nombre', 'apellido', 'dni', 'whatsapp', 'ciudad'] as const
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
  const payment_method = (formData.get('payment_method') as string) || 'transferencia'
  const status = (formData.get('status') as string) || 'approved'
  const external_id = (formData.get('external_id') as string)?.trim() || null

  const { error } = await supabase.from('payments').insert({
    affiliate_id: affiliateId,
    amount,
    currency,
    payment_method,
    status,
    external_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true, message: 'Pago registrado correctamente.' }
}
