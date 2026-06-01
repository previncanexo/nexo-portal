'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendActivationEmail, sendCredentialsEmail, sendInternalNewMemberEmail } from '@/lib/emails'

function addOneMonth(dateStr: string | null): string {
  const base = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const year = base.getFullYear()
  const month = base.getMonth() + 1
  const day = base.getDate()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export async function quickApproveAffiliate(affiliateId: string) {
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, apellido, dni, email, affiliate_number, user_id, fecha_nacimiento, domicilio, plan:plans(id, name, price)')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) return { success: false, message: 'Afiliado no encontrado.' }

  const todayStr = new Date().toISOString().split('T')[0]

  const certNum = parseInt(affiliate.affiliate_number ?? '0', 10)
  const farmaciaNumber = `289${certNum.toString().padStart(8, '0')}0000`

  // Create Auth user if it doesn't exist yet
  let userId = (affiliate as any).user_id as string | null | undefined
  let tempPassword: string | undefined
  if (!userId) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const bytes = randomBytes(12)
    tempPassword = Array.from(bytes).map(b => chars[b % chars.length]).join('')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: affiliate.email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authError) {
      console.error('[quickApproveAffiliate] createUser error:', authError)
      const isAlreadyExists = (authError as any).code === 'email_exists' || authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('exist')
      if (isAlreadyExists) {
        // Look up the existing user by email and link them
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email?.toLowerCase() === affiliate.email.toLowerCase())
        if (existingUser) {
          userId = existingUser.id
          await supabase.from('affiliates').update({ user_id: userId }).eq('id', affiliateId)
        }
      } else {
        return { success: false, message: 'No se pudo crear el acceso al portal. Intentá nuevamente.' }
      }
    } else if (authData?.user) {
      userId = authData.user.id
      // Link user_id immediately so subsequent queries can find it
      await supabase.from('affiliates').update({ user_id: userId }).eq('id', affiliateId)
    }
  }

  const { error } = await supabase
    .from('affiliates')
    .update({
      status: 'active',
      farmacia_number: farmaciaNumber,
      cobertura_desde: todayStr,
      cobertura_hasta: addOneMonth(todayStr),
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliateId)

  if (error) return { success: false, message: error.message }

  const resolvedPlan = Array.isArray(affiliate.plan) ? (affiliate.plan[0] ?? null) : affiliate.plan

  if (tempPassword) {
    await sendCredentialsEmail({
      nombre: affiliate.nombre,
      email: affiliate.email,
      affiliate_number: affiliate.affiliate_number,
      farmacia_number: farmaciaNumber,
      temp_password: tempPassword,
      plan: resolvedPlan,
    })
  }

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
    fecha_nacimiento: (affiliate as any).fecha_nacimiento ?? null,
    domicilio: (affiliate as any).domicilio ?? null,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true }
}
