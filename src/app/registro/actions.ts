'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrationLimiter } from '@/lib/ratelimit'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { sendPendingConfirmationEmail } from '@/lib/emails'
import { findPaidIdentityConflict } from '@/lib/affiliateIdentity'

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
  const planQuery = supabase.from('plans').select('id, name, price')
  // is_active: mismo filtro que la rama plan_slug de api/leads/[id]/route.ts.
  // Sin él, un plan_id de un plan desactivado (p.ej. el legacy "Nexo I" a
  // $19.500 tras la migración de planes) igual resolvía y se cobraba.
  const { data: plan } = input.plan_id
    ? await planQuery.eq('id', input.plan_id).eq('is_active', true).maybeSingle()
    : await planQuery.order('price', { ascending: true }).limit(1).maybeSingle()

  // La identidad (DNI/email) queda reservada solo por afiliados PAGADOS.
  // Los 'pending' no bloquean: se puede reintentar el alta cuantas veces haga falta.
  const identityConflict = await findPaidIdentityConflict(supabase, { dni, email })
  if (identityConflict === 'dni') {
    return {
      success: false,
      error: 'Ya existe una cuenta con ese DNI. Si olvidaste tu contraseña, podés recuperarla desde el login.',
    }
  }
  if (identityConflict === 'email') {
    return {
      success: false,
      error: 'Ya existe una cuenta activa con ese email. Iniciá sesión en el portal.',
    }
  }

  // Retomar el último intento con checkout vigente en vez de generar otra
  // suscripción en MP (doble click, reintento desde el email de recuperación).
  const { data: openLeads } = await supabase
    .from('leads')
    .select('id, checkout_url')
    .eq('email', email)
    .eq('dni', dni)
    .eq('status', 'completed')
    .not('checkout_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
  const openLead = openLeads?.[0] ?? null

  if (openLead?.checkout_url) {
    sendPendingConfirmationEmail({ nombre, email, checkoutUrl: openLead.checkout_url }).catch(() => {})
    return { success: true, checkoutUrl: openLead.checkout_url }
  }

  // Nuevo intento: se guarda como LEAD. El afiliado se crea recién cuando MP
  // confirma el pago (webhook) — hasta entonces se pueden generar todos los
  // intentos que hagan falta con los mismos datos.
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      para_quien: 'para_mi',
      nombre,
      apellido,
      email,
      whatsapp: whatsapp?.trim() || 's/d',
      dni,
      fecha_nacimiento: fechaNacimiento,
      ciudad: ciudad ?? null,
      domicilio: domicilio ?? null,
      medio_pago: 'tarjeta',
      plan_id: plan?.id ?? null,
      status: 'partial',
      referer: '/registro',
    })
    .select('id')
    .single()

  if (leadError || !lead) {
    return {
      success: false,
      error: `Error al iniciar el registro: ${leadError?.message ?? 'desconocido'}`,
    }
  }

  // Suscripción directa en MP (sin plan template) para que external_reference
  // viaje intacto en todos los eventos del webhook.
  try {
    const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
    const preApprovalClient = new PreApproval(mpClient)
    const sub = await preApprovalClient.create({
      body: {
        reason: plan?.name ?? 'Previnca Nexo',
        external_reference: lead.id,
        payer_email: email,
        back_url: `${appUrl}/registro/exito`,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
      },
    })
    const subExt = sub as unknown as { id?: string; init_point?: string }
    const checkoutUrl = subExt.init_point
    if (!checkoutUrl) throw new Error('MP no devolvió URL de pago')

    await supabase
      .from('leads')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        checkout_url: checkoutUrl,
        mp_subscription_id: subExt.id ? String(subExt.id) : null,
      })
      .eq('id', lead.id)

    // Fire-and-forget — don't block the response
    sendPendingConfirmationEmail({ nombre, email, checkoutUrl }).catch(() => {})

    return { success: true, checkoutUrl }
  } catch (err: any) {
    const mpMessage = err?.message ?? String(err)
    const mpCause = JSON.stringify(err?.cause ?? err?.error ?? err?.apiResponse ?? '')
    console.error('[initiatePayment] MP error:', mpMessage, mpCause)
    // Rollback: el lead recién creado no llegó a tener checkout — lo borramos
    // para no ensuciar el panel. No hay afiliado ni usuario de Auth que limpiar.
    try {
      await supabase.from('leads').delete().eq('id', lead.id)
    } catch (rollbackErr) {
      console.error('[mp] Rollback error:', rollbackErr)
    }
    return {
      success: false,
      error: 'Error al procesar el pago. Por favor intentá de nuevo.',
    }
  }
}
