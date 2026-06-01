'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago'

export async function createPlan(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = parseFloat(formData.get('price') as string)

  if (!name) return { success: false, message: 'El nombre es obligatorio.' }
  if (isNaN(price) || price <= 0) return { success: false, message: 'El precio debe ser un número mayor a 0.' }

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
  if (isNaN(price) || price <= 0) return { success: false, message: 'El precio debe ser un número mayor a 0.' }

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

  // Check if any non-cancelled affiliates are using this plan
  const { count } = await supabase
    .from('affiliates')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .not('status', 'eq', 'cancelled')

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message: `No se puede eliminar: ${count} afiliado${count === 1 ? '' : 's'} activo${count === 1 ? '' : 's'} usa${count === 1 ? '' : 'n'} este plan.`,
    }
  }

  const { error } = await supabase.from('plans').delete().eq('id', planId)
  if (error) return { success: false, message: error.message }

  revalidatePath('/admin/planes')
  return { success: true, message: 'Plan eliminado.' }
}

export async function createMpPlan(planId: string): Promise<{ success: boolean; message: string }> {
  const mpToken = process.env.MP_ACCESS_TOKEN
  if (!mpToken) return { success: false, message: 'MP_ACCESS_TOKEN no está configurado.' }

  const supabase = createAdminClient()
  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single()
  if (!plan) return { success: false, message: 'Plan no encontrado.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ''

  try {
    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const planClient = new PreApprovalPlan(mpClient)

    const mpPlan = await planClient.create({
      body: {
        reason: plan.name,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/registro/exito`,
      },
    })

    if (!mpPlan.id) return { success: false, message: 'MP no devolvió ID del plan.' }

    const { error } = await supabase
      .from('plans')
      .update({ mp_plan_id: mpPlan.id })
      .eq('id', planId)

    if (error) return { success: false, message: `DB error: ${error.message}` }

    revalidatePath('/admin/planes')
    return { success: true, message: `Plan vinculado con MP (ID: ${mpPlan.id})` }
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Error al crear el plan en Mercado Pago.' }
  }
}

export async function unlinkMpPlan(planId: string): Promise<{ success: boolean; message: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('plans')
    .update({ mp_plan_id: null })
    .eq('id', planId)

  if (error) return { success: false, message: error.message }
  revalidatePath('/admin/planes')
  return { success: true, message: 'Vínculo con MP eliminado.' }
}
