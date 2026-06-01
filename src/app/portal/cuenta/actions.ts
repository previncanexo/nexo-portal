'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordChangedEmail } from '@/lib/emails'

export async function updateProfile(
  data: { whatsapp: string; ciudad: string; fecha_nacimiento: string },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado.' }

  const adminSupabase = createAdminClient()
  const { data: affiliate } = await adminSupabase
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) return { success: false, error: 'Afiliado no encontrado.' }

  const { error } = await adminSupabase
    .from('affiliates')
    .update({
      whatsapp: data.whatsapp.trim() || null,
      ciudad: data.ciudad.trim() || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/portal')
  revalidatePath('/portal/cuenta')
  return { success: true }
}

export async function notifyPasswordChanged(nombre: string, email: string): Promise<void> {
  await sendPasswordChangedEmail(nombre, email)
}
