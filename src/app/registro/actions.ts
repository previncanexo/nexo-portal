'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrationLimiter } from '@/lib/ratelimit'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { Resend } from 'resend'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function credentialsEmailHtml(
  nombre: string,
  affiliateNumber: string,
  email: string,
  tempPassword: string,
  appUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 0;">
  <h1 style="margin:0 0 8px;font-size:24px;color:#8660EF;">¡Bienvenido a Nexo!</h1>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta fue creada exitosamente. A continuación encontrás tus credenciales de acceso.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de afiliado</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#8660EF;font-family:monospace;">${affiliateNumber}</p>
      </td></tr>
      <tr><td style="padding-bottom:12px;border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Email</p>
        <p style="margin:0;font-size:14px;color:#374151;">${email}</p>
      </td></tr>
      <tr><td style="border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Contraseña temporal</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#111827;font-family:monospace;background:#fff;display:inline-block;padding:4px 10px;border-radius:6px;border:1px solid #e5e7eb;">${tempPassword}</p>
      </td></tr>
    </table>
  </div>
  <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
  <a href="${appUrl}/login" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ingresar al Portal →</a>
</td></tr>
<tr><td style="padding:24px 36px 36px;">
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Nexo by Previnca · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

interface RegisterInput {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp?: string
  ciudad?: string
  fecha_nacimiento?: string
  plan_id?: string
}

type InitiatePaymentResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string }

export async function initiatePayment(input: RegisterInput): Promise<InitiatePaymentResult> {
  if (!process.env.MP_ACCESS_TOKEN) {
    return { success: false, error: 'El sistema de pagos no está configurado.' }
  }

  if (registrationLimiter) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const { success } = await registrationLimiter.limit(ip)
    if (!success) {
      return { success: false, error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' }
    }
  }

  const { nombre, apellido, dni, email, whatsapp, ciudad, fecha_nacimiento } = input

  if (!nombre || !apellido || !dni || !email) {
    return { success: false, error: 'Faltan campos obligatorios: nombre, apellido, DNI y email.' }
  }
  if (!/^\d{7,8}$/.test(dni)) {
    return { success: false, error: 'El DNI debe tener 7 u 8 dígitos numéricos (sin puntos ni espacios).' }
  }

  const supabase = createAdminClient()
  const tempPassword = generateTempPassword()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Fetch selected plan or default to cheapest
  const planQuery = supabase.from('plans').select('id, name, price')
  const { data: plan } = input.plan_id
    ? await planQuery.eq('id', input.plan_id).maybeSingle()
    : await planQuery.order('price', { ascending: true }).limit(1).maybeSingle()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    return { success: false, error: authError.message.includes('already registered')
      ? 'Ya existe una cuenta con ese email.'
      : `Error al crear la cuenta: ${authError.message}` }
  }

  const userId = authData.user.id

  // Create affiliate
  const affiliateData: Record<string, unknown> = {
    nombre, apellido, dni, email,
    user_id: userId,
    status: 'pending',
    plan_id: plan?.id ?? null,
  }
  if (whatsapp) affiliateData.whatsapp = whatsapp
  if (ciudad) affiliateData.ciudad = ciudad
  if (fecha_nacimiento) affiliateData.fecha_nacimiento = fecha_nacimiento

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .insert(affiliateData)
    .select('id, affiliate_number')
    .single()

  if (affiliateError) {
    await supabase.auth.admin.deleteUser(userId)
    const isDniDuplicate = (affiliateError as any).code === '23505' &&
      affiliateError.message.toLowerCase().includes('dni')
    return {
      success: false,
      error: isDniDuplicate
        ? 'Ya existe una cuenta con ese DNI. Si olvidaste tu contraseña, podés recuperarla desde el login.'
        : `Error al crear el afiliado: ${affiliateError.message}`,
    }
  }

  // Send credentials email so user has their password
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
      to: email,
      subject: 'Tus credenciales de acceso a Nexo',
      html: credentialsEmailHtml(nombre, affiliate.affiliate_number, email, tempPassword, appUrl),
    }).catch((err) => console.error('[registro] Resend error:', err))
  }

  // Create MP subscription
  try {
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preApprovalClient = new PreApproval(mpClient)

    const mpResponse = await preApprovalClient.create({
      body: {
        reason: plan?.name ?? 'Plan Base Nexo',
        payer_email: email,
        back_url: `${appUrl}/registro/exito`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan?.price ?? 19500,
          currency_id: 'ARS',
        },
        external_reference: affiliate.id,
        status: 'pending',
      },
    })

    if (!mpResponse.init_point) {
      throw new Error('MP no devolvió URL de pago')
    }

    if (mpResponse.id) {
      await supabase
        .from('affiliates')
        .update({ mp_subscription_id: String(mpResponse.id) })
        .eq('id', affiliate.id)
    }

    return { success: true, checkoutUrl: mpResponse.init_point }
  } catch (err) {
    // Rollback: delete affiliate and auth user
    await supabase.from('affiliates').delete().eq('id', affiliate.id)
    await supabase.auth.admin.deleteUser(userId)
    console.error('[mp] PreApproval error:', err)
    return { success: false, error: 'Error al iniciar el pago con Mercado Pago. Intentá de nuevo.' }
  }
}
