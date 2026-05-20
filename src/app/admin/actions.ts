'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function quickApproveAffiliate(affiliateId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('affiliates')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', affiliateId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true }
}
