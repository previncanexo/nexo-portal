'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordChangedEmail } from '@/lib/emails'

export async function updateProfile(
  affiliateId: string,
  data: { whatsapp: string; ciudad: string; fecha_nacimiento: string },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('affiliates')
    .update({
      whatsapp: data.whatsapp.trim() || null,
      ciudad: data.ciudad.trim() || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliateId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/portal')
  revalidatePath('/portal/cuenta')
  return { success: true }
}

export async function notifyPasswordChanged(nombre: string, email: string): Promise<void> {
  await sendPasswordChangedEmail(nombre, email)
}
