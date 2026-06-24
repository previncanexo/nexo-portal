'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendActivationEmail, sendCredentialsEmail, sendInternalNewMemberEmail } from '@/lib/emails'
import { addOneMonth, todayAR } from '@/lib/dateUtils'

async function requireAdmin(): Promise<{ authorized: true } | { authorized: false; error: { success: false; message: string } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (!user?.email || !adminEmails.includes(user.email)) {
    return { authorized: false, error: { success: false, message: 'No autorizado.' } }
  }
  return { authorized: true }
}

export async function quickApproveAffiliate(affiliateId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.error

  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('nombre, apellido, dni, email, whatsapp, affiliate_number, user_id, fecha_nacimiento, domicilio, plan:plans(id, name, price)')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) return { success: false, message: 'Afiliado no encontrado.' }

  const todayStr = todayAR()

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
        // Instead of a full O(n) listUsers() scan, look up via the affiliates table:
        // if an auth user exists for this email, there must already be an affiliate record linking to them.
        const { data: existingAffiliate } = await supabase
          .from('affiliates')
          .select('user_id')
          .eq('email', affiliate.email)
          .not('user_id', 'is', null)
          .single()
        if (existingAffiliate?.user_id) {
          userId = existingAffiliate.user_id
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

  // El trigger de DB genera affiliate_number + farmacia_number al pasar a 'active'.
  const { data: numbered, error } = await supabase
    .from('affiliates')
    .update({
      status: 'active',
      cobertura_desde: todayStr,
      cobertura_hasta: addOneMonth(todayStr),
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliateId)
    .select('affiliate_number, farmacia_number')
    .single()

  if (error) return { success: false, message: error.message }

  affiliate.affiliate_number = numbered?.affiliate_number ?? affiliate.affiliate_number
  const farmaciaNumber = numbered?.farmacia_number ?? ''

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
    whatsapp: (affiliate as any).whatsapp ?? null,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/afiliados')
  revalidatePath(`/admin/afiliados/${affiliateId}`)

  return { success: true }
}
