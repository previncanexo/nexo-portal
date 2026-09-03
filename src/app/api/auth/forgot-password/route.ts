/**
 * POST /api/auth/forgot-password
 * Recibe { email } y dispara el email de recuperación de contraseña usando
 * la plantilla propia de Nexo (Resend) en lugar del mailer default de Supabase.
 *
 * Flujo:
 *  1. Supabase Admin genera un `action_link` (type=recovery) sin mandar mail.
 *  2. Buscamos el nombre del afiliado por email para personalizar el saludo.
 *  3. Enviamos con `sendPasswordResetEmail` (Resend + plantilla Nexo).
 *
 * La respuesta es siempre { success: true } aunque el email no exista —
 * evita filtrar cuentas registradas.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/emails'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ForgotPasswordInput {
  email?: string
}

export async function POST(req: Request) {
  let body: ForgotPasswordInput
  try {
    body = await req.json()
  } catch {
    return Response.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ success: false, error: 'invalid_email' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexo.portal.previncasalud.com.ar'
  const redirectTo = `${appUrl}/reset-password`

  // Generar link de recovery — no envía email, solo devuelve la URL con el token.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.action_link) {
    // Si el user no existe, generateLink puede devolver error. No filtramos.
    if (error) console.warn('[forgot-password] generateLink:', error.message)
    return Response.json({ success: true })
  }

  const actionLink = data.properties.action_link

  // Nombre del saludo: primero afiliado, sino usamos "usuario"
  const { data: aff } = await supabase
    .from('affiliates')
    .select('nombre')
    .eq('email', email)
    .maybeSingle()
  const nombre = aff?.nombre ?? 'usuario'

  await sendPasswordResetEmail(nombre, email, actionLink)

  return Response.json({ success: true })
}
