'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createPlan(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = parseFloat(formData.get('price') as string)

  if (!name) return { success: false, message: 'El nombre es obligatorio.' }
  if (isNaN(price) || price < 0) return { success: false, message: 'El precio debe ser un número válido.' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('plans').insert({
    name,
    description,
    price,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/planes')
  return { success: true, message: 'Plan creado correctamente.' }
}

export async function updatePlan(planId: string, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = parseFloat(formData.get('price') as string)

  if (!name) return { success: false, message: 'El nombre es obligatorio.' }
  if (isNaN(price) || price < 0) return { success: false, message: 'El precio debe ser un número válido.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('plans')
    .update({ name, description, price, updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/planes')
  revalidatePath('/admin/afiliados')
  return { success: true, message: 'Plan actualizado correctamente.' }
}

export async function deletePlan(planId: string) {
  const supabase = createAdminClient()

  // Check if any affiliates are using this plan
  const { count } = await supabase
    .from('affiliates')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message: `No se puede eliminar: ${count} afiliado${count === 1 ? '' : 's'} usa${count === 1 ? '' : 'n'} este plan.`,
    }
  }

  const { error } = await supabase.from('plans').delete().eq('id', planId)
  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/planes')
  return { success: true, message: 'Plan eliminado.' }
}
