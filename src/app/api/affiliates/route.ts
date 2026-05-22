import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminAffiliateLimiter } from '@/lib/ratelimit'
import type { CreateAffiliatePayload, CreateAffiliateResponse } from '@/lib/types'

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

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    // Only authenticated admins may call this endpoint.
    // Self-registration uses the Server Action in /registro/actions.ts instead.
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user: caller } } = await supabaseAuth.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const adminEmailList = (process.env.ADMIN_EMAILS ?? '')
      .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    if (!adminEmailList.includes(caller.email?.toLowerCase() ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Rate limiting per admin email
    if (adminAffiliateLimiter) {
      try {
        const { success } = await adminAffiliateLimiter.limit(caller.email!)
        if (!success) {
          return NextResponse.json(
            { error: 'Límite de creación de afiliados alcanzado. Esperá unos minutos.' },
            { status: 429 }
          )
        }
      } catch (err) {
        console.error('[affiliates] Rate limiter error (skipping):', err)
      }
    }

    const body: CreateAffiliatePayload = await request.json()

    const { nombre, apellido, dni, email, whatsapp, ciudad, fecha_nacimiento, plan_id } = body

    if (!nombre || !apellido || !dni || !email) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, apellido, dni, email' },
        { status: 400 }
      )
    }
    if (!/^\d{7,8}$/.test(dni)) {
      return NextResponse.json(
        { error: 'El DNI debe tener 7 u 8 dígitos numéricos' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const tempPassword = generateTempPassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        { error: `Error creando usuario: ${authError.message}` },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Create affiliate record
    const affiliateData: Record<string, unknown> = {
      nombre,
      apellido,
      dni,
      email,
      user_id: userId,
      status: 'pending',
    }

    if (whatsapp) affiliateData.whatsapp = whatsapp
    if (ciudad) affiliateData.ciudad = ciudad
    if (fecha_nacimiento) affiliateData.fecha_nacimiento = fecha_nacimiento
    if (plan_id) affiliateData.plan_id = plan_id

    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .insert(affiliateData)
      .select('affiliate_number')
      .single()

    if (affiliateError) {
      // Rollback: delete auth user if affiliate insert failed
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Error creando afiliado: ${affiliateError.message}` },
        { status: 500 }
      )
    }

    const response: CreateAffiliateResponse = {
      affiliate_number: affiliate.affiliate_number,
      temp_password: tempPassword,
      email,
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
        to: email,
        subject: `Bienvenido a Nexo — tus credenciales de acceso`,
        html: credentialsEmailHtml(nombre, affiliate.affiliate_number, email, tempPassword, appUrl),
      }).catch((err) => {
        console.error('[affiliates] Resend error:', err)
      })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
