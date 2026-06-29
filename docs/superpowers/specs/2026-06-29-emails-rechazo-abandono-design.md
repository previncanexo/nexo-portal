# Diseño: Emails de Pago Rechazado y Recuperación de Abandono

**Fecha:** 2026-06-29
**Proyecto:** nexo-portal
**Rama:** feat/emails-rechazo-abandono
**Estado:** Aprobado (decisiones) — pendiente de revisión final de spec y plan

> **Nota de revisión:** esta spec se reescribió tras sincronizar el repo (`git pull`, +26
> commits). El código actual incorpora una tabla `leads` con captación en dos etapas que
> cambia el enfoque del abandono. La versión previa (basada solo en `affiliates`) quedó
> obsoleta.

## Contexto

El sistema de emails solo cubre el camino feliz: confirmación pendiente, credenciales +
bienvenida (pago aprobado) y aviso interno de nueva alta a Previnca. Quedan sin ningún
correo dos situaciones de pérdida de ventas:

1. **Pago rechazado:** el usuario solo ve un mensaje en pantalla; nadie le escribe ni se
   entera Previnca.
2. **Abandono:** quien no completa el proceso queda sin recordatorio ni aviso interno.

## Ciclo de vida actual (verificado en el código)

1. `POST /api/leads` (etapa 1): crea `leads` con `status='partial'` y nombre, apellido,
   email, **whatsapp**, UTMs. Devuelve `leadId` (se guarda en localStorage).
2. `PATCH /api/leads/[id]` (etapa 2): crea `affiliates` con `status='pending'`, genera el
   `checkoutUrl` (MercadoPago `init_point`), marca el lead `status='converted'` y lo asocia
   vía `affiliate_id`. Devuelve `{ leadId, affiliateId, checkoutUrl }`.
3. Existen **tres** caminos que crean afiliados `pending`: `PATCH /api/leads/[id]`,
   `src/app/registro/actions.ts` y `src/app/api/affiliates/route.ts`.

Hallazgos clave:

- **El `checkout_url` (init_point) NO se persiste** en ninguno de los tres caminos. Se usa
  en el momento y se descarta.
- El status `'abandoned'` de `leads` **existe en el schema y en el panel** (`/admin/leads`
  muestra un contador "Abandonados"), pero **ninguna lógica lo setea**. Es un molde sin
  motor. Esta feature lo completa.
- Patrón de dedup del equipo: columnas `*_sent_at` (p. ej. `affiliates.purchase_event_sent_at`).
- Patrón de cron existente (`src/app/api/cron/coverage-reminder/route.ts`): handler `GET`,
  auth `Bearer ${process.env.CRON_SECRET}`, `createAdminClient()`; declarado en `vercel.json`.
- Webhook (`src/app/api/webhooks/mercadopago/route.ts`) solo maneja `status='approved'`.

## Dos momentos de abandono (decisión: cubrir AMBOS)

| Momento                | Vive en                  | Qué pasó                         | Contacto disponible      |
|------------------------|--------------------------|----------------------------------|--------------------------|
| **Abandono de formulario** | `leads` (`partial`)  | Empezó el form, no lo terminó    | email **+ whatsapp**     |
| **Abandono de pago**       | `affiliates` (`pending`) | Terminó el form, no pagó      | email + link de checkout |

Poblaciones disjuntas: un lead `partial` nunca llegó a crear afiliado; un afiliado
`pending` proviene de un lead ya `converted`. Nadie recibe doble correo por el mismo evento.

## Decisiones tomadas (brainstorming con el cliente)

| Aspecto                  | Pago rechazado                  | Abandono                                   |
|--------------------------|---------------------------------|--------------------------------------------|
| Disparador               | Webhook MP (evento `rejected`)  | Cron cada 30 min                           |
| Umbral                   | Inmediato (evento real)         | 1 hora sin avanzar                         |
| Destinatario usuario     | Sí — aviso + link de reintento  | Sí — recordatorio + link para completar    |
| Destinatario Previnca    | Sí — aviso interno              | Sí — aviso interno **con whatsapp + email**|
| Frecuencia               | Por evento (con dedup)          | Un único recordatorio                      |

## A. Cambios de datos — nueva migración

Archivo: `supabase/migrations/20260629000001_add_recovery_fields.sql`

En `affiliates`:
- `checkout_url text` — persistir el `init_point` al crear el afiliado, para el reintento de
  pago en abandono y rechazo.
- `abandonment_notified_at timestamptz` — dedup del recordatorio de abandono de pago.
- `rejection_notified_at timestamptz` — dedup del aviso de rechazo (MP puede reintentar el
  webhook).

En `leads`: no se agregan columnas. La transición `partial → abandoned` actúa como guard de
dedup (una vez `abandoned`, deja de matchear la consulta del cron).

Índice parcial para la consulta de abandono de pago:
`create index idx_affiliates_pending_recovery on public.affiliates (created_at)
where status = 'pending';`

## B. Pago rechazado — modificar el webhook

En `src/app/api/webhooks/mercadopago/route.ts`:
- Agregar manejo de `status='rejected'` (y `cancelled`) en `payment` y
  `subscription_preapproval`, siguiendo cómo ya resuelve el afiliado en el caso aprobado.
- Guard: si `rejection_notified_at` ya está seteado, no reenviar.
- Acciones:
  - `sendPaymentRejectedEmail(...)` al usuario (con `checkout_url` para reintentar).
  - `sendInternalPaymentRejectedEmail(...)` a `INTERNAL_NOTIFICATION_EMAILS` (incluye whatsapp
    del lead, obtenido por `leads.affiliate_id = affiliate.id`).
  - Setear `rejection_notified_at = now()`.

## C. Recuperación de abandono — cron nuevo

Archivo: `src/app/api/cron/abandoned-recovery/route.ts` (espejo de `coverage-reminder`,
auth por `CRON_SECRET`). En `vercel.json`: cron `*/30 * * * *` →
`/api/cron/abandoned-recovery`. El handler hace **dos pasadas**:

### C.1 Abandono de formulario (leads)
- Consulta: `leads` con `status='partial'` AND `created_at < now() - interval '1 hour'`.
- Por cada uno:
  - `sendAbandonedFormEmail(...)` al usuario (link para retomar el onboarding).
  - `sendInternalAbandonedEmail(...)` a Previnca (nombre, email, **whatsapp**, UTMs, link al
    panel de leads).
  - Marcar `leads.status = 'abandoned'` (esto además enciende el contador del admin).

### C.2 Abandono de pago (affiliates)
- Consulta: `affiliates` con `status='pending'` AND
  `created_at < now() - interval '1 hour'` AND `abandonment_notified_at IS NULL` AND
  `checkout_url IS NOT NULL`.
- Por cada uno:
  - `sendAbandonedPaymentEmail(...)` al usuario (botón "Completar mi compra" → `checkout_url`).
  - `sendInternalAbandonedEmail(...)` a Previnca (con whatsapp del lead asociado).
  - Setear `affiliates.abandonment_notified_at = now()`.

### Persistir checkout_url
Guardar `checkout_url` (= `init_point`) en los **tres** caminos que crean afiliados
`pending`: `PATCH /api/leads/[id]`, `src/app/registro/actions.ts`,
`src/app/api/affiliates/route.ts`. Si se omite alguno, esos pendientes no podrán recuperarse.

## D. Emails nuevos — plantillas en `src/lib/emails.ts`

Siguiendo el estilo existente. Copys propuestos (a confirmar por el cliente):

1. **Usuario — pago rechazado**
   Asunto: `No pudimos procesar tu pago — reintentá en un clic`
2. **Previnca — pago rechazado**
   Asunto: `Pago rechazado — [nombre]` (incluye whatsapp + email)
3. **Usuario — abandono de formulario**
   Asunto: `¿Te quedó algo pendiente? Terminá tu alta en Previnca Nexo`
4. **Usuario — abandono de pago**
   Asunto: `Estás a un paso — completá tu pago en Previnca Nexo`
5. **Previnca — abandono** (sirve para ambos tipos)
   Asunto: `Abandono — [nombre] no completó el alta` (nombre, email, **whatsapp**, etapa en la
   que quedó, link al panel)

Aviso a Previnca: un mail por persona (no resumen), consistente con el aviso de nueva alta.

## Edge cases

- **No contactar a quien avanzó:** las consultas filtran por status; al pasar a `converted`
  / `active` dejan de ser candidatos.
- **Reintentos de webhook MP:** cubiertos por `rejection_notified_at`.
- **Corridas repetidas del cron:** abandono de formulario se autoexcluye al pasar a
  `abandoned`; abandono de pago por `abandonment_notified_at`.
- **Pendientes sin `checkout_url`** (creados antes de la migración): excluidos por
  `checkout_url IS NOT NULL`. Solo afecta pendientes históricos.
- **Falsos positivos:** umbral de 1h da colchón para procesos en curso.
- **Auth del cron:** mismo patrón `CRON_SECRET`.

## Riesgo a validar en pruebas

**Vigencia del link de MercadoPago.** El `init_point` se reutiliza como link de
reintento/recuperación. Confirmar que siga válido tras un rechazo o tras 1+ hora. Plan B si
MP lo invalida: el botón apunta a una página de Nexo que regenera el checkout para esa
solicitud.

## Estrategia de pruebas

- Todo contra el **proyecto Supabase de test** (`nexo-portal-test`), nunca producción.
- Verificar: migración aplica limpio; `checkout_url` se persiste en los tres caminos; webhook
  dispara el mail de rechazo una sola vez; el cron marca leads `abandoned` y notifica a la 1h;
  abandono de pago se notifica una sola vez; el flujo feliz no se rompe; el contador
  "Abandonados" del admin se enciende.

## Fuera de alcance (YAGNI)

- Secuencias de múltiples recordatorios (1h/24h/72h).
- Recuperación por WhatsApp automatizada (por ahora el whatsapp solo va en el aviso interno).
- Notificación interna agrupada/resumen.
- Recuperación de estados `suspended`/`cancelled`.
