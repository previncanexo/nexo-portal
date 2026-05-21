import { Resend } from 'resend'

function activationEmailHtml(
  nombre: string,
  affiliateNumber: string,
  planName: string | null,
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
  <h1 style="margin:0 0 8px;font-size:24px;color:#8660EF;">¡Tu cuenta fue aprobada!</h1>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta de Nexo fue revisada y activada. Ya podés acceder al portal con tus credenciales.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de afiliado</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#8660EF;font-family:monospace;">${affiliateNumber}</p>
      </td></tr>
      ${planName ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Plan contratado</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${planName}</p>
      </td></tr>` : ''}
    </table>
  </div>
  <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">Usá el email y la contraseña que te enviamos al momento del registro. Si no la recordás, podés restablecerla desde el portal.</p>
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

function passwordChangedEmailHtml(nombre: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Tu contraseña fue cambiada</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, te avisamos que tu contraseña de Nexo fue actualizada correctamente.</p>
  <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Si no realizaste este cambio, contactanos de inmediato para proteger tu cuenta.</p>
  <a href="${appUrl}/forgot-password" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Restablecer contraseña →</a>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Nexo by Previnca · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function coverageReminderEmailHtml(nombre: string, coverageDate: string, daysLeft: number, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 0;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#ca8a04;">Tu cobertura vence pronto</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cobertura Nexo vence en <strong>${daysLeft} día${daysLeft !== 1 ? 's' : ''}</strong> (${coverageDate}).</p>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Para continuar disfrutando de tus beneficios sin interrupciones, asegurate de tener tu suscripción al día.</p>
  <a href="${appUrl}/portal" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ir al portal →</a>
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

function paymentConfirmedEmailHtml(nombre: string, amount: number, currency: string, appUrl: string): string {
  const formatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 0;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#16a34a;">Pago registrado</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, registramos un pago en tu cuenta Nexo.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Monto recibido</p>
    <p style="margin:0;font-size:32px;font-weight:700;color:#15803d;">${formatted}</p>
  </div>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Podés ver el detalle completo en tu portal de afiliado.</p>
  <a href="${appUrl}/portal" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ver mi portal →</a>
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

export async function sendPaymentConfirmedEmail(
  nombre: string,
  email: string,
  amount: number,
  currency: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
    to: email,
    subject: 'Pago registrado en tu cuenta Nexo',
    html: paymentConfirmedEmailHtml(nombre, amount, currency, appUrl),
  }).catch((err) => console.error('[payment-confirmed-email]', err))
}

export async function sendPasswordChangedEmail(nombre: string, email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
    to: email,
    subject: 'Tu contraseña de Nexo fue cambiada',
    html: passwordChangedEmailHtml(nombre, appUrl),
  }).catch((err) => console.error('[password-changed-email]', err))
}

export async function sendCoverageReminderEmail(
  nombre: string,
  email: string,
  coverageDate: string,
  daysLeft: number,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
    to: email,
    subject: `Tu cobertura Nexo vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
    html: coverageReminderEmailHtml(nombre, coverageDate, daysLeft, appUrl),
  }).catch((err) => console.error('[coverage-reminder-email]', err))
}

export async function sendActivationEmail(affiliate: {
  nombre: string
  email: string
  affiliate_number: string
  plan?: { name: string } | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Nexo by Previnca <onboarding@resend.dev>',
    to: affiliate.email,
    subject: '¡Tu cuenta Nexo fue aprobada!',
    html: activationEmailHtml(affiliate.nombre, affiliate.affiliate_number, affiliate.plan?.name ?? null, appUrl),
  }).catch((err) => {
    console.error('[activation-email] Resend error:', err)
  })
}
