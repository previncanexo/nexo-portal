'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AffiliateStatus } from '@/lib/types'

export async function updateAffiliateStatus(affiliateId: string, status: AffiliateStatus) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('affiliates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', affiliateId)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath(`/admin/afiliados/${affiliateId}`)
  revalidatePath('/admin/afiliados')

  return { success: true, message: 'Estado actualizado correctamente.' }
}
