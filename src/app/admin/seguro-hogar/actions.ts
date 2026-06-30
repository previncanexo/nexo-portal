'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ESTADOS = ['pendiente', 'contactado', 'dado_de_alta'] as const
type Estado = (typeof ESTADOS)[number]

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return !!user?.email && adminEmails.includes(user.email.toLowerCase())
}

export async function updateSeguroHogarStatus(
  id: string,
  status: Estado,
): Promise<{ success: boolean; message?: string }> {
  if (!(await isAdmin())) return { success: false, message: 'No autorizado.' }
  if (!ESTADOS.includes(status)) return { success: false, message: 'Estado inválido.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('seguro_hogar_solicitudes')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, message: error.message }
  revalidatePath('/admin/seguro-hogar')
  return { success: true }
}
