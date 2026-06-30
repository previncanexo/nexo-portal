# Diseño: Psicología On Demand

**Fecha:** 2026-06-29
**Proyecto:** nexo-portal
**Rama:** feat/psicologia-on-demand
**Estado:** Aprobado (diseño) — pendiente de revisión de spec y plan

## Contexto

Nexo quiere ofrecer "Psicología On Demand": un servicio adicional, independiente de la
cobertura de salud estándar, que el afiliado abona por separado ($30.000 fijo por consulta).
La reserva, agenda y cobro (vía MercadoPago) ocurren 100% en una plataforma externa
(videoconsultas.app). El portal solo presenta el servicio, registra el interés (clic) y
redirige.

## Hallazgos del código (verificados)

- `src/app/portal/ServiceCards.tsx` ('use client') define un array de `ServiceItem` (title,
  subtitle, badge, button, bullets, etc.) y un `ServiceInfoModal` reutilizable.
- Ya existe la tarjeta `teleconsultas` ("Teleconsultas Médicas 24/7") con `buttonAction: 'link'`
  y `buttonHref: 'https://doctorprevinca.videoconsultas.app/paciente/autogestion'` — MISMA
  plataforma externa que Psicología On Demand, en su versión de producción. Patrón probado.
- `ServiceCards` se renderiza en `src/app/portal/page.tsx` SOLO cuando `isActive` (~línea 201).
  El gate "solo afiliado activo" es automático.
- `src/app/portal/actions.ts` ('use server') es el patrón de server actions: `createClient` de
  `@/lib/supabase/server`, `auth.getUser()`, query a `affiliates`.

## Decisiones tomadas (brainstorming con el cliente)

1. **Acceso:** solo afiliados ACTIVOS (gate ya existente).
2. **Presentación:** tarjeta de servicio nueva + modal (no página dedicada).
3. **Aviso de costo:** aviso CLARO en el modal ("$30.000 por consulta — se cobra aparte de tu
   cobertura Nexo") + botón "Reservar turno". Sin checkbox.
4. **URL configurable:** env var `NEXT_PUBLIC_PSICOLOGIA_URL`.
5. **Registro de clic:** SÍ (quién y cuándo). Sin panel de admin por ahora.

## Arquitectura

### A. Tarjeta de servicio (`ServiceCards.tsx`)
Nuevo `ServiceItem`:
- `id: 'psicologia'`, título "Psicología On Demand", subtítulo descriptivo.
- Badge **"Pago aparte"** con color diferenciado (señala que NO es parte de la cobertura).
- Ícono de psicología/mente (SVG inline, mismo estilo que los existentes).
- Descripción + bullets.
- **Visibilidad condicional:** si `NEXT_PUBLIC_PSICOLOGIA_URL` no está seteada, la tarjeta NO se
  renderiza (degradación segura).

### B. Modal con aviso y acción
La tarjeta abre un modal que muestra:
- Descripción del servicio.
- **Costo destacado:** "$30.000 por consulta".
- **Aviso explícito:** "Servicio adicional. Se cobra aparte de tu cobertura Nexo."
- Botón **"Reservar turno"** implementado como **enlace real**
  (`<a href={NEXT_PUBLIC_PSICOLOGIA_URL} target="_blank" rel="noopener noreferrer">`).
  - En el `onClick` se dispara el registro del clic en **fire-and-forget** (sin `await` que
    demore la navegación), de modo que el navegador NO bloquee la pestaña nueva.

### C. Registro del clic
- Server action en `src/app/portal/actions.ts`: `registerPsicologiaClick(): Promise<void>`.
  - `auth.getUser()` → buscar el `affiliate` del usuario → `insert` en `psicologia_clicks`.
  - **Best-effort:** si el insert falla, se loguea el error y NO se interrumpe nada (la
    redirección la maneja el `<a>` nativamente, en paralelo).

### D. Datos — nueva migración
Archivo: `supabase/migrations/20260629000002_create_psicologia_clicks.sql`
```sql
create table public.psicologia_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  clicked_at timestamptz not null default now()
);
create index idx_psicologia_clicks_affiliate on public.psicologia_clicks(affiliate_id);
alter table public.psicologia_clicks enable row level security;
create policy "psicologia_clicks: service role" on public.psicologia_clicks for all
  using (auth.role() = 'service_role');
```

### E. Configuración
- `NEXT_PUBLIC_PSICOLOGIA_URL` — en testing: la URL de test
  (`https://test-doctorprevinca.videoconsultas.app/paciente/autogestion`). En prod: a definir.
- Precio: constante en el componente (`const PSICOLOGIA_PRECIO = 30000`), fácil de editar.

## Entorno y salida

- Construir y verificar en **testing/staging** (URL de test). Migración primero al proyecto
  Supabase de **test**.
- NO va a producción hasta tener la URL de prod y aprobación explícita.
- Setear `NEXT_PUBLIC_PSICOLOGIA_URL` en el entorno de testing de Vercel.

## Edge cases

- **Afiliado no activo:** no ve la tarjeta (gate de `page.tsx`).
- **Falla el registro del clic:** la redirección igual ocurre (best-effort, `<a>` nativo).
- **Env var sin setear:** la tarjeta no se renderiza.
- **Bloqueador de pop-ups:** evitado usando `<a target="_blank">` nativo + tracking
  fire-and-forget (sin `window.open` tras `await`).

## Estrategia de pruebas

- Sin test runner en el proyecto → verificación integral: `npm run build` (typecheck) + prueba
  contra Supabase **test** (la migración aplica; un clic inserta una fila en `psicologia_clicks`;
  la tarjeta aparece para un afiliado activo y redirige a la URL de test).

## Fuera de alcance (YAGNI)

- Pagos/turnos en el portal (todo externo).
- Panel de admin para ver los clics.
- SSO o paso de datos del afiliado a la plataforma externa (autogestión genérica).
