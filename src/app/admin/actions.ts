'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendInternalNewMemberEmail } from '@/lib/emails'

export async function quickApproveAffiliate(affiliateId: string) {
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, apellido, dni, email, affiliate_number, plan:plans(id, name, price)')
    .eq('id', affiliateId)
    .single()

  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const certNum = parseInt(affiliate?.affiliate_number ?? '0', 10)
  const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

  const { error } = await supabase
    .from('affiliates')
    .update({
      status: 'active',
      farmacia_number: farmaciaNumber,
      cobertura_desde: today.toISOString().split('T')[0],
      cobertura_hasta: nextMonth.toISOString().split('T')[0],
      updated_at: today.toISOString(),
    })
    .eq('id', affiliateId)

  if (error) return { success: false, message: error.message }

  if (affiliate) {
    const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan

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
  }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true }
}
