'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail } from '@/lib/emails'

export async function quickApproveAffiliate(affiliateId: string) {
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, email, affiliate_number, plan:plans(name)')
    .eq('id', affiliateId)
    .single()

  const { error } = await supabase
    .from('affiliates')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', affiliateId)

  if (error) return { success: false, message: error.message }

  if (affiliate) {
    await sendActivationEmail({
      nombre: affiliate.nombre,
      email: affiliate.email,
      affiliate_number: affiliate.affiliate_number,
      plan: Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan,
    })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true }
}
