'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrationLimiter } from '@/lib/ratelimit'
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago'
import { sendPendingConfirmationEmail } from '@/lib/emails'
import { addOneMonth } from '@/lib/dateUtils'

interface RegisterInput {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp?: string
  ciudad?: string
  domicilio?: string
  fecha_nacimiento?: string
  plan_id?: string
}

type InitiatePaymentResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string }

export async function initiatePayment(input: RegisterInput): Promise<InitiatePaymentResult> {
  const mpToken = process.env.MP_ACCESS_TOKEN
  if (!mpToken) {
    return { success: false, error: 'El sistema de pagos no está configurado.' }
  }

  const headersList = await headers()

  if (registrationLimiter) {
    try {
      const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
      const { success } = await registrationLimiter.limit(ip)
      if (!success) {
        return { success: false, error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }
      }
    } catch (err) {
      console.error('[registro] Rate limiter error (fail open):', err)
    }
  }

  const { nombre, apellido, dni, email, whatsapp, ciudad, domicilio, fecha_nacimiento } = input

  if (!nombre || !apellido || !dni || !email) {
    return { success: false, error: 'Faltan campos obligatorios: nombre, apellido, DNI y email.' }
  }
  if (!/^\d{7,8}$/.test(dni)) {
    return { success: false, error: 'El DNI debe tener 7 u 8 dígitos numéricos (sin puntos ni espacios).' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'El email ingresado no es válido.' }
  }

  const fechaNacimiento = fecha_nacimiento ?? null
  if (fechaNacimiento) {
    const birthDate = new Date(fechaNacimiento + 'T12:00:00')
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
      - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0)
    if (age < 18) {
      return { success: false, error: 'Debés ser mayor de 18 años para registrarte.' }
    }
  }

  const proto = headersList.get('x-forwarded-proto') ?? 'https'
  const host = headersList.get('host') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${host}`

  const supabase = createAdminClient()

  // Fetch selected plan or default to cheapest
  const planQuery = supabase.from('plans').select('id, name, price, mp_plan_id')
  const { data: plan } = input.plan_id
    ? await planQuery.eq('id', input.plan_id).maybeSingle()
    : await planQuery.order('price', { ascending: true }).limit(1).maybeSingle()

  // Check if email already exists
  const { data: existingAffiliate } = await supabase
    .from('affiliates')
    .select('id, affiliate_number, user_id, status, mp_subscription_id, nombre, apellido, whatsapp, ciudad, domicilio, fecha_nacimiento')
    .eq('email', email)
    .maybeSingle()

  if (existingAffiliate && existingAffiliate.status !== 'pending') {
    return {
      success: false,
      error: 'Ya existe una cuenta activa con ese email. Iniciá sesión en el portal.',
    }
  }

  // If pending account exists, resume payment flow instead of creating a new user
  if (existingAffiliate && existingAffiliate.status === 'pending') {
    // Only update fields that are currently blank — don't overwrite existing data
    const updatePayload: Record<string, unknown> = {}
    if (!existingAffiliate.nombre) updatePayload.nombre = nombre
    if (!existingAffiliate.apellido) updatePayload.apellido = apellido
    if (!existingAffiliate.whatsapp) updatePayload.whatsapp = whatsapp
    if (!existingAffiliate.ciudad) updatePayload.ciudad = ciudad
    if (!existingAffiliate.domicilio) updatePayload.domicilio = domicilio
    if (!existingAffiliate.fecha_nacimiento) updatePayload.fecha_nacimiento = fechaNacimiento
    // always update plan_id in case they changed plan
    updatePayload.plan_id = plan?.id ?? null
    updatePayload.updated_at = new Date().toISOString()

    await supabase
      .from('affiliates')
      .update(updatePayload)
      .eq('id', existingAffiliate.id)

    try {
      const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
      const planClient = new PreApprovalPlan(mpClient)
      const mpPlan = await planClient.create({
        body: {
          reason: plan?.name ?? 'Previnca Nexo',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan?.price ?? 19500,
            currency_id: 'ARS',
          },
          back_url: `${appUrl}/registro/exito`,
          external_reference: existingAffiliate.id,
        } as any,
      })
      if (!mpPlan.init_point) throw new Error('MP no devolvió URL de pago')
      const checkoutUrl = mpPlan.init_point
      // Persistir el link de pago para la recuperación de abandono/rechazo.
      await supabase
        .from('affiliates')
        .update({ checkout_url: checkoutUrl })
        .eq('id', existingAffiliate.id)
      const mpId = mpPlan.id ? String(mpPlan.id) : undefined

      if (mpId) {
        await supabase
          .from('affiliates')
          .update({ mp_subscription_id: mpId })
          .eq('id', existingAffiliate.id)
      }

      // Fire-and-forget — don't block the response
      sendPendingConfirmationEmail({
        nombre,
        email,
        checkoutUrl,
      }).catch(() => {})

      return { success: true, checkoutUrl }
    } catch (err: any) {
      const mpMessage = err?.message ?? String(err)
      const mpCause = JSON.stringify(err?.cause ?? err?.error ?? err?.apiResponse ?? '')
      console.error('[initiatePayment] MP error:', mpMessage, mpCause)
      return {
        success: false,
        error: 'Error al procesar el pago. Por favor intentá de nuevo.',
      }
    }
  }

  // New registration flow — Auth user is NOT created here; it will be created by the webhook after payment
  const affiliateData: Record<string, unknown> = {
    nombre, apellido, dni, email,
    user_id: null,
    status: 'pending',
    plan_id: plan?.id ?? null,
  }
  if (whatsapp) affiliateData.whatsapp = whatsapp
  if (ciudad) affiliateData.ciudad = ciudad
  if (domicilio) affiliateData.domicilio = domicilio
  if (fecha_nacimiento) affiliateData.fecha_nacimiento = fecha_nacimiento

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .insert(affiliateData)
    .select('id, affiliate_number')
    .single()

  if (affiliateError) {
    const isDniDuplicate = (affiliateError as any).code === '23505' &&
      affiliateError.message.toLowerCase().includes('dni')
    return {
      success: false,
      error: isDniDuplicate
        ? 'Ya existe una cuenta con ese DNI. Si olvidaste tu contraseña, podés recuperarla desde el login.'
        : `Error al crear el afiliado: ${affiliateError.message}`,
    }
  }

  // Create MP checkout — PreApprovalPlan has no payer_email restriction
  try {
    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const planClient = new PreApprovalPlan(mpClient)

    const mpPlan = await planClient.create({
      body: {
        reason: plan?.name ?? 'Previnca Nexo',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/registro/exito`,
        external_reference: affiliate.id,
      } as any,
    })
    if (!mpPlan.init_point) throw new Error('MP no devolvió URL de pago')
    const checkoutUrl = mpPlan.init_point
    // Persistir el link de pago para la recuperación de abandono/rechazo.
    await supabase
      .from('affiliates')
      .update({ checkout_url: checkoutUrl })
      .eq('id', affiliate.id)
    const mpId = mpPlan.id ? String(mpPlan.id) : undefined

    if (mpId) {
      await supabase
        .from('affiliates')
        .update({ mp_subscription_id: mpId })
        .eq('id', affiliate.id)
    }

    // Fire-and-forget — don't block the response
    sendPendingConfirmationEmail({
      nombre,
      email,
      checkoutUrl,
    }).catch(() => {})

    return { success: true, checkoutUrl }
  } catch (err: any) {
    const mpMessage = err?.message ?? String(err)
    const mpCause = JSON.stringify(err?.cause ?? err?.error ?? '')
    console.error('[initiatePayment] MP error:', mpMessage, mpCause)
    // Rollback: delete the lead record — no Auth user was created, so no user cleanup needed
    try {
      await supabase.from('affiliates').delete().eq('id', affiliate.id)
    } catch (rollbackErr) {
      console.error('[mp] Rollback error:', rollbackErr)
    }
    return {
      success: false,
      error: 'Error al procesar el pago. Por favor intentá de nuevo.',
    }
  }
}
