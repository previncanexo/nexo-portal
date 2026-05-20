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
