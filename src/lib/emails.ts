import { Resend } from 'resend'

function activationEmailHtml(
  nombre: string,
  affiliateNumber: string,
  farmaciaNumber: string | null,
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
  <h1 style="margin:0 0 16px;font-size:24px;color:#8660EF;">¡Bienvenido/a a Previnca Nexo!</h1>
  <p style="margin:0 0 12px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, gracias por sumarte a una nueva manera de acceder a servicios de salud y bienestar de forma simple, flexible y digital.</p>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;">Junto a este mensaje recibís tu credencial digital para comenzar a disfrutar de nuestros servicios.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de afiliado</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#8660EF;font-family:monospace;">${affiliateNumber}</p>
      </td></tr>
      ${farmaciaNumber ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:12px;padding-bottom:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° farmacia</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#374151;font-family:monospace;">${farmaciaNumber}</p>
      </td></tr>` : ''}
      ${planName ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Plan contratado</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${planName}</p>
      </td></tr>` : ''}
    </table>
  </div>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Los servicios de Teleconsultas médicas y Urgencias 24/7 estarán habilitados dentro de las 24 horas hábiles de recibida la credencial digital. El resto de los servicios cuentan con una carencia de 30 días. Finalizado ese período, podrás acceder a guardia odontológica y descuentos en farmacias.</p>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Recordá que estamos a disposición para acompañarte y responder cualquier consulta que tengas.</p>
  <a href="${appUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#8660EF,#E879A0);color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Acceder al portal →</a>
</td></tr>
<tr><td style="padding:24px 36px 36px;">
  <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">¡Gracias por elegirnos!</p>
  <p style="margin:0 0 0;font-size:13px;color:#6b7280;">Equipo Previnca Nexo</p>
  <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Este correo fue generado automáticamente · Previnca Nexo</p>
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
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
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
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
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
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
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
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
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
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
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
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: email,
    subject: `Tu cobertura Nexo vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
    html: coverageReminderEmailHtml(nombre, coverageDate, daysLeft, appUrl),
  }).catch((err) => console.error('[coverage-reminder-email]', err))
}

function resubscribeEmailHtml(nombre: string, checkoutUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 0;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#8660EF;">Tu cuenta fue reactivada</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta Nexo fue reactivada. Para continuar con tu suscripción mensual, necesitás autorizarla en Mercado Pago.</p>
  <a href="${checkoutUrl}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Autorizar suscripción →</a>
</td></tr>
<tr><td style="padding:24px 36px 36px;">
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendResubscribeEmail(nombre: string, email: string, checkoutUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: email,
    subject: 'Tu cuenta Nexo fue reactivada — autorizá tu suscripción',
    html: resubscribeEmailHtml(nombre, checkoutUrl),
  }).catch((err) => console.error('[resubscribe-email]', err))
}

function internalNewMemberEmailHtml(
  nombre: string,
  apellido: string,
  dni: string,
  email: string,
  affiliateNumber: string,
  farmaciaNumber: string,
  planName: string | null,
  affiliateId: string,
  appUrl: string,
  fechaNacimiento: string | null,
  domicilio: string | null,
): string {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:32px 36px 0;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8660EF;">Nueva alta confirmada</p>
  <h1 style="margin:0 0 20px;font-size:22px;color:#111827;">Un nuevo afiliado se sumó a Nexo</h1>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:14px;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Nombre y apellido</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${nombre} ${apellido}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${email}</p>
        </td>
      </tr>
      <tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">DNI</p>
        <p style="margin:0;font-size:15px;font-weight:700;color:#111827;font-family:monospace;">${dni}</p>
      </td></tr>
      ${fechaNacimiento ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Fecha de nacimiento</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${fechaNacimiento}</p>
      </td></tr>` : ''}
      ${domicilio ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Domicilio</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${domicilio}</p>
      </td></tr>` : ''}
      <tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de certificado</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#8660EF;font-family:monospace;">${affiliateNumber}</p>
      </td></tr>
      <tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de farmacia</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#111827;font-family:monospace;">${farmaciaNumber}</p>
      </td></tr>
      ${planName ? `<tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;padding-bottom:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Plan</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${planName}</p>
      </td></tr>` : ''}
      <tr><td style="border-top:1px solid #e5e7eb;padding-top:14px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Fecha y hora de alta</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${dateStr} · ${timeStr} hs (ARG)</p>
      </td></tr>
    </table>
  </div>
  <a href="${appUrl}/admin/afiliados/${affiliateId}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ver en el admin →</a>
</td></tr>
<tr><td style="padding:24px 36px 32px;">
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Este mail es solo para uso interno. · Previnca Nexo · Generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendInternalNewMemberEmail(affiliate: {
  id: string
  nombre: string
  apellido: string
  dni: string
  email: string
  affiliate_number: string
  farmacia_number: string
  plan?: { name: string } | null
  fecha_nacimiento?: string | null
  domicilio?: string | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const planName = Array.isArray(affiliate.plan)
    ? (affiliate.plan[0]?.name ?? null)
    : (affiliate.plan?.name ?? null)

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: ['lgurini@previncasalud.com.ar', 'krodriguez@previncasalud.com.ar', 'sistemas@previncasalud.com.ar'],
    subject: `Nueva alta — ${affiliate.nombre} se suscribió a Nexo`,
    html: internalNewMemberEmailHtml(
      affiliate.nombre,
      affiliate.apellido,
      affiliate.dni,
      affiliate.email,
      affiliate.affiliate_number,
      affiliate.farmacia_number,
      planName,
      affiliate.id,
      appUrl,
      affiliate.fecha_nacimiento ?? null,
      affiliate.domicilio ?? null,
    ),
  }).catch((err) => console.error('[internal-new-member-email]', err))
}

function suspensionEmailHtml(nombre: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#ea580c;">Tu cuenta fue suspendida</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta Nexo fue suspendida temporalmente.</p>
  <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Si creés que esto es un error o querés regularizar tu situación, contactanos a través del portal.</p>
  <a href="${appUrl}/portal" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ir al portal →</a>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function cancellationEmailHtml(nombre: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#dc2626;">Tu cuenta fue cancelada</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta Nexo fue cancelada.</p>
  <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Lamentamos que hayas dejado de ser parte de Nexo. Si querés volver a sumarte en el futuro, no dudes en contactarnos.</p>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function passwordResetEmailHtml(nombre: string, recoveryUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 8px;font-size:22px;color:#8660EF;">Restablecé tu contraseña</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, un administrador solicitó el restablecimiento de tu contraseña en Nexo.</p>
  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hacé clic en el botón para crear una nueva contraseña. El link es válido por 24 horas.</p>
  <a href="${recoveryUrl}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Restablecer contraseña →</a>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Si no solicitaste este cambio, podés ignorar este mail.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendSuspensionEmail(nombre: string, email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: email,
    subject: 'Tu cuenta Nexo fue suspendida',
    html: suspensionEmailHtml(nombre, appUrl),
  }).catch((err) => console.error('[suspension-email]', err))
}

export async function sendCancellationEmail(nombre: string, email: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: email,
    subject: 'Tu cuenta Nexo fue cancelada',
    html: cancellationEmailHtml(nombre),
  }).catch((err) => console.error('[cancellation-email]', err))
}

export async function sendPasswordResetEmail(nombre: string, email: string, recoveryUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: email,
    subject: 'Restablecé tu contraseña de Nexo',
    html: passwordResetEmailHtml(nombre, recoveryUrl),
  }).catch((err) => console.error('[password-reset-email]', err))
}

export async function sendActivationEmail(affiliate: {
  nombre: string
  email: string
  affiliate_number: string
  farmacia_number?: string | null
  plan?: { name: string } | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: affiliate.email,
    bcc: ['cbanegas@previncaholding.com.ar', 'sistemas@previncaseguros.com.ar', 'sistemas@previncasalud.com.ar'],
    subject: '¡Bienvenido/a a Previnca Nexo!',
    html: activationEmailHtml(affiliate.nombre, affiliate.affiliate_number, affiliate.farmacia_number ?? null, affiliate.plan?.name ?? null, appUrl),
  }).catch((err) => {
    console.error('[activation-email] Resend error:', err)
  })
}

function credentialsEmailHtml(
  nombre: string,
  affiliateNumber: string,
  farmaciaNumber: string,
  email: string,
  tempPassword: string,
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
  <h1 style="margin:0 0 8px;font-size:24px;color:#8660EF;">¡Bienvenido/a a Nexo!</h1>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hola <strong>${nombre}</strong>, tu cuenta fue creada exitosamente. A continuación encontrás tus credenciales de acceso.</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° de afiliado</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#8660EF;font-family:monospace;">${affiliateNumber}</p>
      </td></tr>
      <tr><td style="padding-bottom:12px;border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">N° farmacia</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#374151;font-family:monospace;">${farmaciaNumber}</p>
      </td></tr>
      ${planName ? `<tr><td style="padding-bottom:12px;border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Plan contratado</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${planName}</p>
      </td></tr>` : ''}
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
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Previnca Nexo · Este correo fue generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendCredentialsEmail(affiliate: {
  nombre: string
  email: string
  affiliate_number: string
  farmacia_number: string
  temp_password: string
  plan?: { name: string } | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const planName = Array.isArray(affiliate.plan)
    ? (affiliate.plan[0]?.name ?? null)
    : (affiliate.plan?.name ?? null)

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Previnca Nexo <onboarding@resend.dev>',
    to: affiliate.email,
    bcc: ['cbanegas@previncaholding.com.ar', 'sistemas@previncaseguros.com.ar', 'sistemas@previncasalud.com.ar'],
    subject: 'Tus credenciales de acceso a Nexo',
    html: credentialsEmailHtml(
      affiliate.nombre,
      affiliate.affiliate_number,
      affiliate.farmacia_number,
      affiliate.email,
      affiliate.temp_password,
      planName,
      appUrl,
    ),
  }).catch((err) => {
    console.error('[credentials-email] Resend error:', err)
  })
}
