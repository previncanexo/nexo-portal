# Emails de Pago Rechazado y Recuperación de Abandono — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar emails automáticos para pago rechazado y recuperación de abandono (de formulario y de pago) al portal Nexo.

**Architecture:** Una migración agrega campos de recuperación a `affiliates`. El webhook de MercadoPago gana una rama para pagos rechazados. Un cron nuevo cada 30 min detecta abandonos en dos pasadas (leads `partial` y affiliates `pending`) y notifica. Se persiste el `checkout_url` en los tres caminos que crean afiliados pendientes. Cinco plantillas nuevas de email en `src/lib/emails.ts`.

**Tech Stack:** Next.js (App Router), Supabase (admin client), Resend, MercadoPago SDK, Vercel Cron.

## Global Constraints

- No agregar dependencias nuevas. Usar Resend (ya instalado) vía el patrón de `src/lib/emails.ts`.
- Emails en español. Marca: gradiente `#8660EF → #E879A0`, fuente sans-serif, tablas inline (mismo estilo que las plantillas existentes).
- Destinatarios internos: `process.env.INTERNAL_NOTIFICATION_EMAILS` (CSV, trim, filter Boolean).
- Hora Argentina: `new Date(Date.now() - 3 * 60 * 60 * 1000)` con `timeZone: 'UTC'` (mismo patrón que `internalNewMemberEmailHtml`).
- Toda función de envío empieza con `if (!process.env.RESEND_API_KEY) return` y cierra con `.catch((err) => console.error('[tag]', err))`.
- Auth del cron: `Bearer ${process.env.CRON_SECRET}`; si no hay secret, permitir (dev).
- Cliente admin: `import { createAdminClient } from '@/lib/supabase/admin'`.
- Umbral de abandono: 1 hora. Cadencia del cron: `*/30 * * * *`.
- Verificación (no hay test runner): cada tarea cierra con `npm run build` + `npm run lint` OK, y prueba contra el proyecto Supabase **de test** (`nexo-portal-test`). Nunca producción.
- Commits: conventional commits, sin atribución AI.

## File Structure

- Create: `supabase/migrations/20260629000001_add_recovery_fields.sql` — campos `checkout_url`, `abandonment_notified_at`, `rejection_notified_at` + índice parcial.
- Modify: `src/app/api/leads/[id]/route.ts` — persistir `checkout_url`.
- Modify: `src/app/registro/actions.ts` — persistir `checkout_url`.
- Modify: `src/app/api/affiliates/route.ts` — persistir `checkout_url`.
- Modify: `src/lib/emails.ts` — 5 funciones nuevas + helpers HTML.
- Modify: `src/app/api/webhooks/mercadopago/route.ts` — rama de pago rechazado.
- Create: `src/app/api/cron/abandoned-recovery/route.ts` — cron de abandono (2 pasadas).
- Modify: `vercel.json` — registrar el cron.

---

### Task 1: Migración — campos de recuperación

**Files:**
- Create: `supabase/migrations/20260629000001_add_recovery_fields.sql`

**Interfaces:**
- Produces: columnas `affiliates.checkout_url text`, `affiliates.abandonment_notified_at timestamptz`, `affiliates.rejection_notified_at timestamptz`; índice `idx_affiliates_pending_recovery`.

- [ ] **Step 1: Escribir la migración**

```sql
-- Campos para recuperación de abandono y notificación de rechazo.
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS abandonment_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_notified_at timestamptz;

-- Índice parcial para la consulta del cron de abandono de pago.
CREATE INDEX IF NOT EXISTS idx_affiliates_pending_recovery
  ON public.affiliates (created_at)
  WHERE status = 'pending';

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Aplicar contra el proyecto de TEST**

Confirmar que el CLI apunta a test (NO producción) y aplicar:

Run:
```bash
cd nexo-portal
cat supabase/.temp/project-ref   # debe ser icesuzwyfhcpaukserqt (test). Si no, frenar.
supabase link --project-ref icesuzwyfhcpaukserqt
supabase db push
```
Expected: la migración `20260629000001_add_recovery_fields` se aplica sin error.

- [ ] **Step 3: Verificar columnas**

Run:
```bash
supabase db diff --schema public | head -40
```
Expected: sin diferencias pendientes para `affiliates` (las columnas ya existen en remoto).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260629000001_add_recovery_fields.sql
git commit -m "feat(db): campos de recuperacion de abandono y rechazo en affiliates"
```

---

### Task 2: Persistir `checkout_url` en los tres caminos

**Files:**
- Modify: `src/app/api/leads/[id]/route.ts` (tras generar el `checkoutUrl`, antes de devolver ~línea 295)
- Modify: `src/app/registro/actions.ts:132` y `:209` (tras `const checkoutUrl = mpPlan.init_point`)
- Modify: `src/app/api/affiliates/route.ts` (si genera checkoutUrl; ver Step 3)

**Interfaces:**
- Consumes: columna `affiliates.checkout_url` (Task 1).
- Produces: cada afiliado `pending` queda con su `checkout_url` poblado.

- [ ] **Step 1: leads/[id]/route.ts — persistir checkout_url**

Ubicar donde se obtiene el `checkoutUrl` (init_point) y el `affiliate.id` ya existe. Agregar inmediatamente después de tener ambos:

```typescript
    // Persistir el link de pago para la recuperación de abandono/rechazo.
    await supabase
      .from('affiliates')
      .update({ checkout_url: checkoutUrl })
      .eq('id', affiliate.id)
```

- [ ] **Step 2: registro/actions.ts — persistir checkout_url (ambas ramas)**

En cada rama, justo después de `const checkoutUrl = mpPlan.init_point` (líneas ~132 y ~209), donde el id del afiliado está disponible como `affiliateId` (o el nombre que use esa rama; verificar la variable del id en cada bloque):

```typescript
    await supabase
      .from('affiliates')
      .update({ checkout_url: checkoutUrl })
      .eq('id', affiliateId)
```

- [ ] **Step 3: api/affiliates/route.ts — persistir si corresponde**

Inspeccionar el archivo: si genera un `checkoutUrl`/`init_point`, agregar el mismo update tras crearlo. Si NO genera link (alta manual por admin sin checkout), NO agregar nada y dejar este comentario en el PR:

Run:
```bash
grep -nE "init_point|checkoutUrl|checkout_url" src/app/api/affiliates/route.ts
```
Expected: si hay matches → agregar el update; si no hay → no aplica (documentarlo).

- [ ] **Step 4: Build y lint**

Run: `npm run build && npm run lint`
Expected: sin errores de tipo ni de lint.

- [ ] **Step 5: Verificar persistencia contra test**

Hacer un alta de prueba (onboarding hasta generar checkout) apuntando a test, luego:

Run (SQL editor de Supabase test o psql):
```sql
select id, email, status, checkout_url from affiliates
where status = 'pending' order by created_at desc limit 1;
```
Expected: `checkout_url` NO es null en el registro recién creado.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/leads/ src/app/registro/actions.ts src/app/api/affiliates/route.ts
git commit -m "feat(checkout): persistir checkout_url en afiliados pendientes"
```

---

### Task 3: Plantillas de email nuevas

**Files:**
- Modify: `src/lib/emails.ts` (agregar al final, antes del EOF)

**Interfaces:**
- Consumes: `resendFrom()`, patrón de `process.env.RESEND_API_KEY`, `process.env.NEXT_PUBLIC_APP_URL`, `INTERNAL_NOTIFICATION_EMAILS`.
- Produces (firmas exactas que consumen Task 4 y Task 5):
  - `sendPaymentRejectedEmail(args: { nombre: string; email: string; checkoutUrl: string | null }): Promise<void>`
  - `sendInternalPaymentRejectedEmail(args: { nombre: string; apellido: string; email: string; whatsapp: string | null; dni: string | null; affiliateId: string }): Promise<void>`
  - `sendAbandonedFormEmail(args: { nombre: string; email: string }): Promise<void>`
  - `sendAbandonedPaymentEmail(args: { nombre: string; email: string; checkoutUrl: string }): Promise<void>`
  - `sendInternalAbandonedEmail(args: { nombre: string; apellido: string | null; email: string; whatsapp: string | null; etapa: 'formulario' | 'pago'; adminPath: string }): Promise<void>`

- [ ] **Step 1: Helper de HTML compartido para usuario**

Agregar un helper genérico (reutiliza el estilo de marca) al final de `emails.ts`:

```typescript
function recoveryUserEmailHtml(opts: {
  titulo: string
  saludo: string
  cuerpo: string
  ctaLabel: string
  ctaUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="height:6px;background:linear-gradient(90deg,#8660EF,#E879A0);"></td></tr>
<tr><td style="padding:36px 36px 0;">
  <h1 style="margin:0 0 16px;font-size:24px;color:#8660EF;">${opts.titulo}</h1>
  <p style="margin:0 0 12px;color:#374151;font-size:15px;">${opts.saludo}</p>
  <p style="margin:0 0 24px;color:#374151;font-size:15px;">${opts.cuerpo}</p>
  <a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#8660EF,#E879A0);color:#ffffff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">${opts.ctaLabel} →</a>
</td></tr>
<tr><td style="padding:24px 36px 36px;">
  <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">¿Tenés alguna duda?</p>
  <p style="margin:0;font-size:13px;color:#6b7280;">Escribinos por WhatsApp al 341 505-6130 y te ayudamos.</p>
  <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Este correo fue generado automáticamente · Previnca Nexo</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
```

- [ ] **Step 2: Helper de HTML para avisos internos**

```typescript
function recoveryInternalEmailHtml(opts: {
  titulo: string
  etiqueta: string
  nombre: string
  apellido: string | null
  email: string
  whatsapp: string | null
  detalle: string
  adminUrl: string
}): string {
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
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8660EF;">${opts.etiqueta}</p>
  <h1 style="margin:0 0 20px;font-size:22px;color:#111827;">${opts.titulo}</h1>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Nombre</p>
    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">${opts.nombre}${opts.apellido ? ' ' + opts.apellido : ''}</p>
    <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Email</p>
    <p style="margin:0 0 12px;font-size:14px;color:#374151;">${opts.email}</p>
    ${opts.whatsapp ? `<p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">WhatsApp</p>
    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">${opts.whatsapp}</p>` : ''}
    <p style="margin:0 0 2px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Detalle</p>
    <p style="margin:0;font-size:14px;color:#374151;">${opts.detalle} · ${dateStr} ${timeStr} hs (ARG)</p>
  </div>
  <a href="${opts.adminUrl}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ver en el admin →</a>
</td></tr>
<tr><td style="padding:24px 36px 32px;">
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;">Solo para uso interno · Previnca Nexo · Generado automáticamente.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function internalRecipients(): string[] {
  return (process.env.INTERNAL_NOTIFICATION_EMAILS ?? '')
    .split(',').map(e => e.trim()).filter(Boolean)
}
```

- [ ] **Step 3: Las 5 funciones de envío**

```typescript
export async function sendPaymentRejectedEmail(args: {
  nombre: string; email: string; checkoutUrl: string | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: resendFrom(),
    to: args.email,
    subject: 'No pudimos procesar tu pago — reintentá en un clic',
    html: recoveryUserEmailHtml({
      titulo: 'Tu pago no se aprobó',
      saludo: `Hola <strong>${args.nombre}</strong>, tu pago para Previnca Nexo no pudo procesarse.`,
      cuerpo: 'No te preocupes: podés reintentarlo ahora mismo desde el botón de abajo. Si el problema persiste, escribinos y lo resolvemos.',
      ctaLabel: 'Reintentar pago',
      ctaUrl: args.checkoutUrl ?? `${appUrl}/registro`,
    }),
  }).catch((err) => console.error('[payment-rejected-email]', err))
}

export async function sendInternalPaymentRejectedEmail(args: {
  nombre: string; apellido: string; email: string; whatsapp: string | null; dni: string | null; affiliateId: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const to = internalRecipients()
  if (to.length === 0) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: resendFrom(),
    to,
    subject: `Pago rechazado — ${args.nombre} ${args.apellido}`,
    html: recoveryInternalEmailHtml({
      titulo: 'Un pago fue rechazado',
      etiqueta: 'Pago rechazado',
      nombre: args.nombre,
      apellido: args.apellido,
      email: args.email,
      whatsapp: args.whatsapp,
      detalle: args.dni ? `DNI ${args.dni}` : 'Pago no aprobado por MercadoPago',
      adminUrl: `${appUrl}/admin/afiliados/${args.affiliateId}`,
    }),
  }).catch((err) => console.error('[internal-payment-rejected-email]', err))
}

export async function sendAbandonedFormEmail(args: {
  nombre: string; email: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: resendFrom(),
    to: args.email,
    subject: '¿Te quedó algo pendiente? Terminá tu alta en Previnca Nexo',
    html: recoveryUserEmailHtml({
      titulo: 'Estás a un paso',
      saludo: `Hola <strong>${args.nombre}</strong>, empezaste tu alta en Previnca Nexo y quedó a mitad de camino.`,
      cuerpo: 'Completar tus datos lleva menos de 2 minutos y activás tu cobertura. Retomá desde donde lo dejaste con el botón de abajo.',
      ctaLabel: 'Completar mi alta',
      ctaUrl: `${appUrl}/registro`,
    }),
  }).catch((err) => console.error('[abandoned-form-email]', err))
}

export async function sendAbandonedPaymentEmail(args: {
  nombre: string; email: string; checkoutUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: resendFrom(),
    to: args.email,
    subject: 'Estás a un paso — completá tu pago en Previnca Nexo',
    html: recoveryUserEmailHtml({
      titulo: '¡Ya casi estás!',
      saludo: `Hola <strong>${args.nombre}</strong>, completaste tus datos pero falta el pago para activar tu cobertura.`,
      cuerpo: 'Terminá tu suscripción ahora desde el botón de abajo y recibí tus credenciales de acceso al instante.',
      ctaLabel: 'Completar mi compra',
      ctaUrl: args.checkoutUrl,
    }),
  }).catch((err) => console.error('[abandoned-payment-email]', err))
}

export async function sendInternalAbandonedEmail(args: {
  nombre: string; apellido: string | null; email: string; whatsapp: string | null;
  etapa: 'formulario' | 'pago'; adminPath: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const to = internalRecipients()
  if (to.length === 0) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: resendFrom(),
    to,
    subject: `Abandono (${args.etapa}) — ${args.nombre}${args.apellido ? ' ' + args.apellido : ''}`,
    html: recoveryInternalEmailHtml({
      titulo: 'Un prospecto no completó el alta',
      etiqueta: `Abandono de ${args.etapa}`,
      nombre: args.nombre,
      apellido: args.apellido,
      email: args.email,
      whatsapp: args.whatsapp,
      detalle: args.etapa === 'formulario' ? 'Abandonó el formulario de onboarding' : 'No completó el pago',
      adminUrl: `${appUrl}${args.adminPath}`,
    }),
  }).catch((err) => console.error('[internal-abandoned-email]', err))
}
```

- [ ] **Step 4: Build y lint**

Run: `npm run build && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/emails.ts
git commit -m "feat(emails): plantillas de rechazo y recuperacion de abandono"
```

---

### Task 4: Pago rechazado — rama en el webhook

**Files:**
- Modify: `src/app/api/webhooks/mercadopago/route.ts` (dentro del bloque `if (body.type === 'payment' && body.data?.id)`, después de resolver `ppa.external_reference`)

**Interfaces:**
- Consumes: `sendPaymentRejectedEmail`, `sendInternalPaymentRejectedEmail` (Task 3); columnas `rejection_notified_at`, `checkout_url` (Task 1/2).
- Produces: efecto colateral (emails + flag). No exporta nada.

- [ ] **Step 1: Importar las funciones nuevas**

En el bloque de imports de emails del webhook, agregar:

```typescript
import { sendPaymentRejectedEmail, sendInternalPaymentRejectedEmail } from '@/lib/emails'
```
(Si ya hay un import agrupado desde `@/lib/emails`, sumar los dos nombres a ese import en lugar de duplicarlo.)

- [ ] **Step 2: Agregar la rama de rechazo**

Dentro de `if (body.type === 'payment' && body.data?.id)`, tras obtener `payment`, agregar (en paralelo al `if (payment.status === 'approved' ...)`):

```typescript
      if (payment.status === 'rejected') {
        // Resolver el afiliado igual que el flujo aprobado: subscription → external_reference.
        const mpRej = payment as unknown as MPPaymentExt
        let rejAffiliateId: string | null = null
        if (mpRej.subscription_id) {
          try {
            const preApprovalClient = new PreApproval(mpClient)
            const pre = await preApprovalClient.get({ id: mpRej.subscription_id as string })
            const preExt = pre as unknown as MPPreApprovalExt
            rejAffiliateId = preExt.external_reference || null
            if (!rejAffiliateId && preExt.preapproval_plan_id) {
              const planClient = new PreApprovalPlan(mpClient)
              const mpPlan = await planClient.get({ preApprovalPlanId: String(preExt.preapproval_plan_id) })
              rejAffiliateId = (mpPlan as unknown as MPPlanExt).external_reference || null
            }
          } catch (rejErr) {
            console.error('[mp-webhook] rejected: no se pudo resolver el afiliado:', rejErr)
          }
        }

        if (rejAffiliateId) {
          const { data: aff } = await supabase
            .from('affiliates')
            .select('id, nombre, apellido, dni, email, whatsapp, checkout_url, status, rejection_notified_at')
            .eq('id', rejAffiliateId)
            .single()

          // Solo notificar si sigue pendiente y no se notificó antes (dedup de reintentos de MP).
          if (aff && aff.status === 'pending' && !aff.rejection_notified_at) {
            await supabase
              .from('affiliates')
              .update({ rejection_notified_at: new Date().toISOString() })
              .eq('id', aff.id)

            await sendPaymentRejectedEmail({
              nombre: aff.nombre,
              email: aff.email,
              checkoutUrl: aff.checkout_url ?? null,
            })
            await sendInternalPaymentRejectedEmail({
              nombre: aff.nombre,
              apellido: aff.apellido,
              email: aff.email,
              whatsapp: aff.whatsapp ?? null,
              dni: aff.dni ?? null,
              affiliateId: aff.id,
            })
          }
        }
      }
```

> Nota: `MPPaymentExt`, `MPPreApprovalExt`, `MPPlanExt`, `PreApproval`, `PreApprovalPlan`, `mpClient` ya existen en el archivo (los usa el flujo aprobado). Reutilizarlos, no redefinirlos.

- [ ] **Step 3: Build y lint**

Run: `npm run build && npm run lint`
Expected: sin errores de tipo (verifica que `subscription_id`, `external_reference`, etc. existan en los tipos `MP*Ext`).

- [ ] **Step 4: Verificar dedup lógico (lectura)**

Revisar a ojo: la rama setea `rejection_notified_at` ANTES de enviar y filtra por `!aff.rejection_notified_at`. Confirmar que un segundo webhook de rechazo para el mismo afiliado NO reenvía.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/mercadopago/route.ts
git commit -m "feat(webhook): notificar pago rechazado a usuario y a Previnca"
```

---

### Task 5: Cron de recuperación de abandono

**Files:**
- Create: `src/app/api/cron/abandoned-recovery/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `createAdminClient`, `sendAbandonedFormEmail`, `sendAbandonedPaymentEmail`, `sendInternalAbandonedEmail` (Task 3); columnas de Task 1/2; tabla `leads`.
- Produces: endpoint `GET /api/cron/abandoned-recovery`.

- [ ] **Step 1: Crear el route del cron**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendAbandonedFormEmail,
  sendAbandonedPaymentEmail,
  sendInternalAbandonedEmail,
} from '@/lib/emails'

// Vercel envía Authorization: Bearer <CRON_SECRET> automáticamente.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // permitir en dev sin secret
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const results = { form: 0, payment: 0 }

  // ---- Pasada 1: abandono de FORMULARIO (leads partial de +1h) ----
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('id, nombre, apellido, email, whatsapp')
    .eq('status', 'partial')
    .lt('created_at', oneHourAgo)

  if (leadsErr) {
    console.error('[abandoned-recovery] leads error:', leadsErr.message)
  } else {
    for (const lead of leads ?? []) {
      await sendAbandonedFormEmail({ nombre: lead.nombre, email: lead.email })
      await sendInternalAbandonedEmail({
        nombre: lead.nombre,
        apellido: lead.apellido ?? null,
        email: lead.email,
        whatsapp: lead.whatsapp ?? null,
        etapa: 'formulario',
        adminPath: '/admin/leads',
      })
      await supabase.from('leads').update({ status: 'abandoned' }).eq('id', lead.id)
      results.form++
    }
  }

  // ---- Pasada 2: abandono de PAGO (affiliates pending de +1h, con checkout_url) ----
  const { data: affiliates, error: affErr } = await supabase
    .from('affiliates')
    .select('id, nombre, apellido, email, whatsapp, checkout_url')
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo)
    .is('abandonment_notified_at', null)
    .not('checkout_url', 'is', null)

  if (affErr) {
    console.error('[abandoned-recovery] affiliates error:', affErr.message)
  } else {
    for (const aff of affiliates ?? []) {
      await supabase
        .from('affiliates')
        .update({ abandonment_notified_at: new Date().toISOString() })
        .eq('id', aff.id)
      await sendAbandonedPaymentEmail({
        nombre: aff.nombre,
        email: aff.email,
        checkoutUrl: aff.checkout_url as string,
      })
      await sendInternalAbandonedEmail({
        nombre: aff.nombre,
        apellido: aff.apellido ?? null,
        email: aff.email,
        whatsapp: aff.whatsapp ?? null,
        etapa: 'pago',
        adminPath: `/admin/afiliados/${aff.id}`,
      })
      results.payment++
    }
  }

  console.log('[abandoned-recovery] sent:', results)
  return NextResponse.json({ ok: true, ...results })
}
```

- [ ] **Step 2: Registrar el cron en vercel.json**

Reemplazar el array `crons` para incluir el nuevo (mantener el existente):

```json
{
  "crons": [
    { "path": "/api/cron/coverage-reminder", "schedule": "0 12 * * *" },
    { "path": "/api/cron/abandoned-recovery", "schedule": "*/30 * * * *" }
  ],
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

- [ ] **Step 3: Build y lint**

Run: `npm run build && npm run lint`
Expected: sin errores; el endpoint aparece en el output del build como ruta `/api/cron/abandoned-recovery`.

- [ ] **Step 4: Probar el endpoint contra test**

Con `.env.local` apuntando a test y `npm run dev` corriendo:

Run:
```bash
curl -s http://localhost:3000/api/cron/abandoned-recovery | head
```
Expected: `{"ok":true,"form":N,"payment":M}`. Verificar en la DB de test que: leads viejos `partial` pasaron a `abandoned`; affiliates `pending` viejos tienen `abandonment_notified_at` seteado. Revisar en Resend que se enviaron los correos.

- [ ] **Step 5: Verificar idempotencia**

Run el mismo `curl` una segunda vez.
Expected: `{"ok":true,"form":0,"payment":0}` (nadie se reprocesa).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/abandoned-recovery/route.ts vercel.json
git commit -m "feat(cron): recuperacion de abandono de formulario y de pago"
```

---

### Task 6: Verificación integral y PR

**Files:** ninguno (verificación + entrega)

- [ ] **Step 1: Recorrido completo contra test**

- Crear un lead nuevo y NO completarlo → forzar `created_at` a +1h atrás en la DB de test → correr el cron → confirmar mail de formulario + interno + lead `abandoned`.
- Completar un alta hasta `pending` (sin pagar) → forzar `created_at` a +1h → correr el cron → confirmar mail de pago + interno + `abandonment_notified_at`.
- Simular un pago rechazado (o invocar la rama con un payload de test) → confirmar mail de rechazo + interno + `rejection_notified_at`.
- Confirmar que el flujo feliz (pago aprobado) sigue funcionando sin cambios.
- Confirmar que el contador "Abandonados" del panel `/admin/leads` ahora refleja los leads abandonados.

- [ ] **Step 2: Validar el riesgo del link de MercadoPago**

Tomar un `checkout_url` persistido de un afiliado `pending` de >1h y abrirlo en el navegador.
Expected: el link sigue llevando a un checkout válido. Si MercadoPago lo invalida → activar plan B (botón a una página de Nexo que regenere el checkout) y documentarlo como follow-up.

- [ ] **Step 3: Push y PR**

```bash
git push -u origin feat/emails-rechazo-abandono
gh pr create --title "feat: emails de pago rechazado y recuperación de abandono" --body "Implementa notificaciones de pago rechazado y recuperación de abandono (formulario + pago) según docs/superpowers/specs/2026-06-29-emails-rechazo-abandono-design.md"
```

- [ ] **Step 4: Antes de mergear a producción**

- Setear/confirmar en Vercel (producción) las env vars: `CRON_SECRET`, `INTERNAL_NOTIFICATION_EMAILS`, `RESEND_FROM`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- Aplicar la migración a producción: `supabase link --project-ref yfrltkihecqogibngkmf && supabase db push` (paso deliberado y consciente — es producción).

## Self-Review

- **Spec coverage:** Pago rechazado → Task 3+4. Abandono de formulario → Task 3+5 (pasada 1). Abandono de pago → Task 2+3+5 (pasada 2). Migración → Task 1. checkout_url en 3 caminos → Task 2. Cron en vercel.json → Task 5. Riesgo del link MP → Task 6 Step 2. Pruebas contra test → todas las tareas. ✔ sin gaps.
- **Placeholder scan:** sin TBD/TODO; todo el código está completo. La única indagación condicional (api/affiliates Step 3) tiene comando concreto y criterio de decisión.
- **Type consistency:** las firmas de las 5 funciones en Task 3 (Interfaces) se consumen idénticas en Task 4 y Task 5. `checkoutUrl` es `string | null` en rechazo y `string` en abandono de pago (garantizado por el filtro `.not('checkout_url','is',null)`).
