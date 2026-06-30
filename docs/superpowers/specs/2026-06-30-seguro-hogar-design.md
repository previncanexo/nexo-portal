# Diseño: Seguro de Hogar On Demand

**Fecha:** 2026-06-30
**Proyecto:** nexo-portal
**Rama:** feat/seguro-hogar
**Estado:** Aprobado (diseño) — pendiente de contenido (cobertura completa), spec review y plan

## Contexto

Nexo quiere ofrecer "Seguro de Hogar", un producto adicional independiente de la cobertura
de salud. El portal presenta los dos planes, registra la solicitud (quién + qué plan) para
seguimiento comercial, muestra el texto legal obligatorio, y redirige a un formulario externo
de contratación. La aseguradora (San Cristóbal) da el alta dentro de las 48 hs hábiles y envía
la póliza por mail — eso ocurre fuera del portal. El portal NO sabe si la persona terminó el
formulario externo; por eso se registra el clic, para poder cruzar y llamar a quien no terminó.

## Hallazgos del código (verificados)

- `src/app/portal/ServiceCards.tsx` ('use client') + `ServiceInfoModal`: patrón de tarjetas de
  servicio. Se renderiza solo para afiliados activos (gate en `portal/page.tsx`).
- `src/app/portal/actions.ts` ('use server'): patrón de server actions (`createClient` server,
  `auth.getUser()`, query a `affiliates`).
- `src/app/admin/leads/` + `src/app/admin/leads/page.tsx`: patrón de ABM/listado con estados en
  el admin. A reusar para el ABM de Seguro de Hogar.

## Decisiones tomadas (brainstorming con el cliente)

1. **Acceso:** solo afiliados ACTIVOS (gate ya existente).
2. **Presentación:** una tarjeta de servicio + modal que muestra los dos planes.
3. **Link:** mismo para ambos planes, configurable por env var. Se registra qué plan eligió.
4. **ABM:** lista en el admin con estado de seguimiento (pendiente / contactado / dado de alta).
5. **"Ver cobertura completa":** despliega el detalle inline en el modal (contenido a proveer
   por el cliente — ver "Contenido pendiente").
6. **Texto legal:** obligatorio al pie del modal, textual.

## Datos de los planes (de la imagen provista)

| | Plan A | Plan B |
|---|---|---|
| Nombre | HOGAR PROTEGIDO | HOGAR PROTEGIDO |
| Badge | HASTA 1ER PISO | 2DO PISO + |
| Alcance | Casas, PB y 1er piso · Solo en Rosario | 2do piso en adelante · Dentro y fuera de Rosario |
| Precio | $19.000/mes · 6 cuotas sin interés | $22.000/mes · 6 cuotas sin interés |
| Coberturas | Incendio Edificio · Responsabilidad Civil · Equipos Electrónicos | (idem) |

Identificadores internos de plan (para el registro): `hasta_1er_piso`, `segundo_piso_plus`.

## Arquitectura

### A. Tarjeta de servicio (`ServiceCards.tsx`)
Nuevo `ServiceItem` `id: 'seguro-hogar'`, título "Seguro de Hogar", badge "Pago aparte",
ícono de hogar/escudo (SVG inline). Abre un modal propio (los dos planes no entran en el
`ServiceInfoModal` genérico → modal dedicado `SeguroHogarModal`).
- Visibilidad condicional: si `NEXT_PUBLIC_SEGURO_HOGAR_URL` no está seteada, la tarjeta no se
  renderiza.

### B. Modal `SeguroHogarModal`
- Muestra los dos planes (datos de la tabla de arriba).
- Cada plan: las 3 coberturas + un toggle **"Ver cobertura completa"** que despliega el detalle
  inline (contenido pendiente).
- Botón **"Contratar"** por plan (enlace real `<a href={URL} target="_blank" rel="noopener noreferrer">`).
  En `onClick` dispara `registerSeguroHogarSolicitud(plan)` en fire-and-forget (sin `await`
  que bloquee la apertura).
- **Texto legal al pie** (verbatim):
  > Cobertura sujeta a los términos y condiciones de la póliza correspondiente a la
  > contratación, brindada por la compañía SAN CRISTÓBAL SEGUROS, CUIT 34-50004533-9,
  > inscripta en la Superintendencia de Seguros de la Nación (SSN) mediante Nro. 0192.
  > PREVINCA SERVICIOS SOCIALES S.A.C.I.F.I.Y.A., CUIT 30-54026445-3, interviene como Agente
  > Institorio de la aseguradora inscripto en el Registro de Agentes Institorios de la SSN
  > bajo el N° 233.

### C. Registro de la solicitud
- Server action en `src/app/portal/actions.ts`:
  `registerSeguroHogarSolicitud(plan: 'hasta_1er_piso' | 'segundo_piso_plus'): Promise<void>`.
  - `auth.getUser()` → buscar el `affiliate` → `insert` en `seguro_hogar_solicitudes` con
    `plan`, `status='pendiente'`.
  - Best-effort: si falla, se loguea y NO interrumpe (la redirección la maneja el `<a>` nativo).

### D. Datos — nueva migración
Archivo: `supabase/migrations/20260630000001_create_seguro_hogar_solicitudes.sql`
```sql
create table public.seguro_hogar_solicitudes (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  plan text not null check (plan in ('hasta_1er_piso', 'segundo_piso_plus')),
  status text not null default 'pendiente' check (status in ('pendiente', 'contactado', 'dado_de_alta')),
  clicked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seguro_hogar_affiliate on public.seguro_hogar_solicitudes(affiliate_id);
create index idx_seguro_hogar_status on public.seguro_hogar_solicitudes(status);
create trigger seguro_hogar_updated_at before update on public.seguro_hogar_solicitudes
  for each row execute function public.handle_updated_at();
alter table public.seguro_hogar_solicitudes enable row level security;
create policy "seguro_hogar: service role" on public.seguro_hogar_solicitudes for all
  using (auth.role() = 'service_role');
```

### E. ABM en el admin (`/admin/seguro-hogar`)
- Página nueva que lista las solicitudes con: nombre y apellido del afiliado, contacto
  (email + WhatsApp), plan elegido, fecha, estado.
- Acción para cambiar el estado (pendiente → contactado → dado de alta), vía server action.
- Reusa el patrón visual y de datos de `src/app/admin/leads/`.
- Se agrega el enlace a la nav del admin (donde estén leads/pagos/planes).

### F. Configuración y entorno
- `NEXT_PUBLIC_SEGURO_HOGAR_URL` — valor: `https://solicitud.agi.previncaholding.com.ar/?ref=1`.
- Precios y datos de planes como constantes en el componente (fáciles de editar).
- Construir y verificar en **testing/staging**. Migración primero al proyecto Supabase de test.
- Setear `NEXT_PUBLIC_SEGURO_HOGAR_URL` en el entorno de testing de Vercel.

## Contenido pendiente (a proveer por el cliente antes de implementar)

- **Detalle de "cobertura completa"** por plan: el texto exacto de las coberturas ampliadas
  (de la segunda imagen / póliza). No se inventa — debe ser textual. Si no llega a tiempo, se
  puede implementar primero con las 3 coberturas visibles y sumar el detalle después.

## Edge cases

- **Afiliado no activo:** no ve la tarjeta.
- **Falla el registro:** la redirección igual ocurre (best-effort).
- **Env var sin setear:** la tarjeta no se renderiza.
- **Bloqueo de pop-ups:** evitado con `<a target="_blank">` + registro fire-and-forget.

## Estrategia de pruebas

- Sin test runner → verificación integral: `npm run build` + prueba contra Supabase test
  (migración aplica; un "Contratar" inserta fila con el plan correcto; el ABM lista y cambia
  estados; la tarjeta aparece para activos y redirige).

## Fuera de alcance (YAGNI)

- Contratación/pago dentro del portal (todo en el formulario externo + alta de la aseguradora).
- Unificar el registro con psicología (se mantienen separados; revisable a futuro).
- Notificaciones por email de la solicitud (el alta y la póliza los maneja la aseguradora).

## Restricción técnica del proyecto (de AGENTS.md)

Esta versión de Next.js tiene breaking changes respecto a lo conocido. Antes de escribir
código, leer la guía relevante en `node_modules/next/dist/docs/` (server actions, componentes,
etc.). Esto se traslada como restricción obligatoria al plan de implementación.
