# Seguro de Hogar On Demand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar al portal una tarjeta "Seguro de Hogar" (solo activos) con un modal de dos planes, detalle de cobertura, texto legal y botón "Contratar" que registra la solicitud y redirige a un formulario externo; más un ABM en el admin para ver las solicitudes y cambiar su estado de seguimiento.

**Architecture:** Migración crea `seguro_hogar_solicitudes` (con estado). Server action registra la solicitud (best-effort) con el plan elegido. En `ServiceCards.tsx` se agrega la tarjeta + modal. En `/admin/seguro-hogar` se agrega un listado (server component, patrón de `admin/leads`) con un select de estado por fila (client + server action protegida por `requireAdmin`).

**Tech Stack:** Next.js 15.5.18 App Router (server actions, server + client components), Supabase, estilos inline existentes.

## Global Constraints

- **Next.js 15.5.18:** `node_modules/next/dist/docs/` NO existe en este proyecto; seguir los patrones existentes del código (no inventar APIs).
- No agregar dependencias nuevas.
- Gate: `npm run build` (typecheck). `npm run lint` está ROTO a nivel proyecto (ESLint 9 flat-config) — NO usarlo.
- Sin test runner → verificación integral contra Supabase **test** (`nexo-portal-test`), nunca prod.
- Env var: `NEXT_PUBLIC_SEGURO_HOGAR_URL` (valor: `https://solicitud.agi.previncaholding.com.ar/?ref=1`). Es **build-time** (client component): si no está seteada, la tarjeta NO se renderiza.
- Identificadores de plan (exactos): `'hasta_1er_piso'`, `'segundo_piso_plus'`.
- Estados (exactos): `'pendiente'`, `'contactado'`, `'dado_de_alta'`.
- Texto legal VERBATIM (ver Task 3). Cobertura completa: constante (ver Task 3); **omitir "Seg. Técnico — Línea Blanca"** (monto sin confirmar).
- Solo afiliados activos ven la tarjeta (gate existente en `portal/page.tsx`: `ServiceCards` se renderiza solo si `isActive`).
- Admin: las páginas bajo `/admin` están protegidas por `src/app/admin/layout.tsx` (chequeo `ADMIN_EMAILS`). Las server actions del ABM usan `requireAdmin()` (patrón de `admin/afiliados/[id]/actions.ts`).
- Redirección: `<a href={URL} target="_blank" rel="noopener noreferrer">` + registro fire-and-forget (sin `await` que bloquee la apertura).
- Estilo consistente con el código existente (glass, `var(--purple)`/`var(--pink)`, `var(--font-dm-sans)`; admin usa el patrón de `admin/leads/page.tsx`).
- Commits: conventional commits, sin atribución AI.

## File Structure

- Create: `supabase/migrations/20260630000001_create_seguro_hogar_solicitudes.sql`
- Modify: `src/app/portal/actions.ts` — `registerSeguroHogarSolicitud`.
- Modify: `src/app/portal/ServiceCards.tsx` — ícono + `SeguroHogarModal` + ítem de servicio + handleAction + render.
- Create: `src/app/admin/seguro-hogar/page.tsx` — listado + stats.
- Create: `src/app/admin/seguro-hogar/actions.ts` — `updateSeguroHogarStatus`.
- Create: `src/app/admin/seguro-hogar/StatusSelect.tsx` — select de estado (client).
- Modify: `src/app/admin/AdminNav.tsx` — link nuevo en `NAV_LINKS`.

---

### Task 1: Migración — tabla seguro_hogar_solicitudes

**Files:**
- Create: `supabase/migrations/20260630000001_create_seguro_hogar_solicitudes.sql`

**Interfaces:**
- Produces: tabla `seguro_hogar_solicitudes (id, affiliate_id, plan, status, clicked_at, updated_at)`.

- [ ] **Step 1: Escribir la migración**

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

create trigger seguro_hogar_updated_at
  before update on public.seguro_hogar_solicitudes
  for each row execute function public.handle_updated_at();

alter table public.seguro_hogar_solicitudes enable row level security;

create policy "seguro_hogar: service role" on public.seguro_hogar_solicitudes for all
  using (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
```

(`public.handle_updated_at()` ya existe — definida en `20260519000001_initial_schema.sql`.)

- [ ] **Step 2: Commit** (la aplicación a la DB de test la hace el controlador)

```bash
git add supabase/migrations/20260630000001_create_seguro_hogar_solicitudes.sql
git commit -m "feat(db): tabla seguro_hogar_solicitudes"
```

---

### Task 2: Server action registerSeguroHogarSolicitud

**Files:**
- Modify: `src/app/portal/actions.ts` (agregar al final)

**Interfaces:**
- Consumes: tabla de Task 1; `createClient` (async), `createAdminClient` (ya importados en el archivo).
- Produces: `registerSeguroHogarSolicitud(plan: 'hasta_1er_piso' | 'segundo_piso_plus'): Promise<void>` — best-effort, nunca tira.

- [ ] **Step 1: Agregar la action** (al final de `src/app/portal/actions.ts`)

El archivo ya tiene `'use server'`, `createClient` de `@/lib/supabase/server` y `createAdminClient` de `@/lib/supabase/admin`. Reusarlos.

```typescript
// Registro best-effort de la solicitud de Seguro de Hogar. No interrumpe la redirección.
export async function registerSeguroHogarSolicitud(
  plan: 'hasta_1er_piso' | 'segundo_piso_plus',
): Promise<void> {
  try {
    if (plan !== 'hasta_1er_piso' && plan !== 'segundo_piso_plus') return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    await admin.from('seguro_hogar_solicitudes').insert({
      affiliate_id: affiliate?.id ?? null,
      plan,
    })
  } catch (err) {
    console.error('[seguro-hogar-solicitud]', err)
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compila sin errores de tipo.

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/actions.ts
git commit -m "feat(portal): server action registrar solicitud de seguro de hogar"
```

---

### Task 3: Tarjeta + modal de Seguro de Hogar

**Files:**
- Modify: `src/app/portal/ServiceCards.tsx`

**Interfaces:**
- Consumes: `registerSeguroHogarSolicitud` (Task 2).
- Produces: tarjeta nueva visible para activos cuando `NEXT_PUBLIC_SEGURO_HOGAR_URL` está seteada.

- [ ] **Step 1: Imports y constantes** (al top, después de los imports existentes)

```typescript
import { registerSeguroHogarSolicitud } from './actions'

const SEGURO_HOGAR_URL = process.env.NEXT_PUBLIC_SEGURO_HOGAR_URL

const SEGURO_PLANES = [
  {
    id: 'hasta_1er_piso' as const,
    badge: 'Hasta 1er piso',
    alcance: 'Casas, PB y 1er piso · Solo en Rosario',
    precio: '$19.000',
  },
  {
    id: 'segundo_piso_plus' as const,
    badge: '2do piso +',
    alcance: '2do piso en adelante · Dentro y fuera de Rosario',
    precio: '$22.000',
  },
]

const SEGURO_COBERTURAS_PRINCIPALES = ['Incendio Edificio', 'Responsabilidad Civil', 'Equipos Electrónicos']

// Detalle desplegable (igual para ambos planes). "Línea Blanca" se omite (monto sin confirmar).
const SEGURO_COBERTURA_COMPLETA = [
  { nombre: 'Incendio Edificio', monto: '$80.000.000', detalle: 'Reconstrucción y/o reparación y/o reposición · Incendio Primer Riesgo Absoluto $8.000.000 · Huracán, Vendaval, Ciclón y/o Tornado — Sublímite 100%' },
  { nombre: 'Incendio Contenido', monto: '$3.200.000', detalle: 'Huracán, Vendaval, Ciclón y/o Tornado — Sublímite 100% · Daños a Equipos Electrónicos por Rayo — Sublímite 100%' },
  { nombre: 'Cristales, vidrios y espejos', monto: '$700.000', detalle: '' },
  { nombre: 'Resp. Civil Hechos Privados', monto: '$4.000.000', detalle: '' },
  { nombre: 'Resp. Civil Linderos', monto: '$6.000.000', detalle: '' },
  { nombre: 'Seg. Técnico — Eq. Electrónicos', monto: '$800.000', detalle: '' },
]

const SEGURO_LEGAL = 'Cobertura sujeta a los términos y condiciones de la póliza correspondiente a la contratación, brindada por la compañía SAN CRISTÓBAL SEGUROS, CUIT 34-50004533-9, inscripta en la Superintendencia de Seguros de la Nación (SSN) mediante Nro. 0192. PREVINCA SERVICIOS SOCIALES S.A.C.I.F.I.Y.A., CUIT 30-54026445-3, interviene como Agente Institorio de la aseguradora inscripto en el Registro de Agentes Institorios de la SSN bajo el N° 233.'
```

- [ ] **Step 2: Ícono** (junto a los otros `function IconX()`)

```typescript
function IconHogar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}
```

- [ ] **Step 3: Componente `SeguroHogarModal`** (junto a los otros modales del archivo)

```typescript
function SeguroHogarModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
  const [coberturaAbierta, setCoberturaAbierta] = useState(false)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(18,5,61,0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', boxShadow: '0 4px 16px rgba(134,96,239,0.22)' }}>
            <service.Icon />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{service.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>{service.subtitle}</p>
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
          {SEGURO_PLANES.map((p) => (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>HOGAR PROTEGIDO</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(134,96,239,0.18)', color: 'var(--purple)' }}>{p.badge}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>{p.alcance}</p>
              <p className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.precio}<span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>/mes</span></p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>6 cuotas sin interés</p>
              <ul className="flex flex-col gap-1.5 mb-3">
                {SEGURO_COBERTURAS_PRINCIPALES.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-dm-sans)' }}>
                    <span style={{ color: 'var(--pink)' }}>✔</span>{c}
                  </li>
                ))}
              </ul>
              <a
                href={SEGURO_HOGAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { void registerSeguroHogarSolicitud(p.id) }}
                className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}
              >
                Contratar
              </a>
            </div>
          ))}

          <button
            onClick={() => setCoberturaAbierta((v) => !v)}
            className="text-xs font-semibold text-left"
            style={{ color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            {coberturaAbierta ? 'Ocultar cobertura completa ▲' : 'Ver cobertura completa ▼'}
          </button>
          {coberturaAbierta && (
            <div className="flex flex-col gap-2.5">
              {SEGURO_COBERTURA_COMPLETA.map((c, i) => (
                <div key={i} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>{c.nombre}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--pink)', fontFamily: 'var(--font-dm-sans)' }}>{c.monto}</span>
                  </div>
                  {c.detalle && <p className="text-[11px] mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>{c.detalle}</p>}
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-dm-sans)' }}>{SEGURO_LEGAL}</p>
        </div>

        <div className="px-5 pb-6 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ítem de servicio** (dentro del array `services`, condicionado a la env var)

```typescript
    ...(SEGURO_HOGAR_URL
      ? [{
          id: 'seguro-hogar',
          title: 'Seguro de Hogar',
          subtitle: 'Protegé tu casa, se contrata aparte',
          badge: 'Pago aparte',
          badgeColor: '#d97706',
          badgeBg: 'rgba(217,119,6,0.10)',
          buttonLabel: 'Ver planes',
          buttonAction: 'modal' as const,
          accentColor: 'white',
          accentBg: 'rgba(134,96,239,0.10)',
          glowColor: 'rgba(217,119,6,0.14)',
          Icon: IconHogar,
          description: 'Asegurá tu hogar con planes pensados para Rosario y la región. Es un producto adicional, independiente de tu cobertura Nexo, que se contrata y abona por separado.',
          bullets: [
            'Dos planes según tu vivienda',
            'Incendio, Responsabilidad Civil y más',
            'Producto adicional, se contrata aparte',
          ],
        }]
      : []),
```

- [ ] **Step 5: Estado + branch en handleAction + render**

Agregar el `useState`:
```typescript
  const [seguroHogarModalOpen, setSeguroHogarModalOpen] = useState(false)
```

En `handleAction`, dentro de la rama `'modal'`, agregar el branch (antes de psicología/urgencias):
```typescript
    } else if (service.buttonAction === 'modal') {
      if (service.id === 'seguro-hogar') setSeguroHogarModalOpen(true)
      else if (service.id === 'psicologia') setPsicologiaModalOpen(true)
      else if (service.id === 'urgencias') setUrgenciasModalOpen(true)
      else setFarmaciaModalOpen(true)
```

Render del modal (junto a los otros modales condicionales):
```typescript
      {seguroHogarModalOpen && (
        <SeguroHogarModal
          service={services.find((s) => s.id === 'seguro-hogar')!}
          onClose={() => setSeguroHogarModalOpen(false)}
        />
      )}
```

> Nota: este branch en `handleAction` asume que la tarea de Psicología On Demand ya está mergeada en esta rama. Si esta rama NO contiene psicología, omitir el `else if (service.id === 'psicologia')` y dejar solo `seguro-hogar` + `urgencias` + fallback.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: compila sin errores (cuidar el union type — `buttonAction: 'modal' as const`).

- [ ] **Step 7: Commit**

```bash
git add src/app/portal/ServiceCards.tsx
git commit -m "feat(portal): tarjeta Seguro de Hogar con modal de planes y registro"
```

---

### Task 4: ABM en el admin (/admin/seguro-hogar)

**Files:**
- Create: `src/app/admin/seguro-hogar/page.tsx`
- Create: `src/app/admin/seguro-hogar/actions.ts`
- Create: `src/app/admin/seguro-hogar/StatusSelect.tsx`
- Modify: `src/app/admin/AdminNav.tsx`

**Interfaces:**
- Consumes: tabla `seguro_hogar_solicitudes` (Task 1); `createAdminClient`, `createClient`, `requireAdmin` pattern.
- Produces: página de listado con cambio de estado.

- [ ] **Step 1: Server action de cambio de estado** — `src/app/admin/seguro-hogar/actions.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ESTADOS = ['pendiente', 'contactado', 'dado_de_alta'] as const
type Estado = (typeof ESTADOS)[number]

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  return !!user?.email && adminEmails.includes(user.email.toLowerCase())
}

export async function updateSeguroHogarStatus(
  id: string,
  status: Estado,
): Promise<{ success: boolean; message?: string }> {
  if (!(await isAdmin())) return { success: false, message: 'No autorizado.' }
  if (!ESTADOS.includes(status)) return { success: false, message: 'Estado inválido.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('seguro_hogar_solicitudes')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, message: error.message }
  revalidatePath('/admin/seguro-hogar')
  return { success: true }
}
```

- [ ] **Step 2: Componente client de estado** — `src/app/admin/seguro-hogar/StatusSelect.tsx`

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateSeguroHogarStatus } from './actions'

const OPCIONES: { value: 'pendiente' | 'contactado' | 'dado_de_alta'; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'dado_de_alta', label: 'Dado de alta' },
]

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status)
  const [isPending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as 'pendiente' | 'contactado' | 'dado_de_alta'
    const prev = value
    setValue(next)
    startTransition(async () => {
      const res = await updateSeguroHogarStatus(id, next)
      if (!res.success) setValue(prev)
    })
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={isPending}
      className="px-2 py-1 rounded-md text-xs font-semibold"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
    >
      {OPCIONES.map((o) => (
        <option key={o.value} value={o.value} style={{ color: '#000' }}>{o.label}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Página de listado** — `src/app/admin/seguro-hogar/page.tsx`

Mismo patrón visual que `src/app/admin/leads/page.tsx`. Trae las solicitudes con join al afiliado.

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import StatusSelect from './StatusSelect'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguro de Hogar — Admin Nexo' }

interface SolicitudRow {
  id: string
  plan: string
  status: string
  clicked_at: string
  affiliate: { nombre: string | null; apellido: string | null; email: string | null; whatsapp: string | null } | null
}

const PLAN_LABEL: Record<string, string> = {
  hasta_1er_piso: 'Hasta 1er piso',
  segundo_piso_plus: '2do piso +',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function SeguroHogarPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('seguro_hogar_solicitudes')
    .select('id, plan, status, clicked_at, affiliate:affiliates(nombre, apellido, email, whatsapp)')
    .order('clicked_at', { ascending: false })
    .limit(500)

  if (error) {
    return <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.5)' }}>Error al cargar solicitudes: {error.message}</div>
  }

  const rows = (data ?? []) as unknown as SolicitudRow[]
  const stats = {
    total: rows.length,
    pendiente: rows.filter((r) => r.status === 'pendiente').length,
    contactado: rows.filter((r) => r.status === 'contactado').length,
    dado_de_alta: rows.filter((r) => r.status === 'dado_de_alta').length,
  }

  return (
    <div className="px-4 sm:px-8 pt-24 pb-12 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#fff' }}>
          Seguro de Hogar
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.95rem' }}>
          Solicitudes de contratación (clic en &quot;Contratar&quot;) para seguimiento comercial.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#fff' },
          { label: 'Pendientes', value: stats.pendiente, color: '#fbbf24' },
          { label: 'Contactados', value: stats.contactado, color: '#a08af2' },
          { label: 'Dados de alta', value: stats.dado_de_alta, color: '#4ade80' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-dm-sans)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)', color: '#fff' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Fecha', 'Nombre', 'Email', 'WhatsApp', 'Plan', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Sin solicitudes todavía.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{fmtDate(r.clicked_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.affiliate?.nombre ?? '—'} {r.affiliate?.apellido ?? ''}</td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.affiliate?.email ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.75)' }}>{r.affiliate?.whatsapp ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.6)' }}>{PLAN_LABEL[r.plan] ?? r.plan}</td>
                    <td className="px-4 py-3"><StatusSelect id={r.id} status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Agregar el link en el nav** — `src/app/admin/AdminNav.tsx`

En el array `NAV_LINKS` (~líneas 9-14), agregar:
```typescript
  { href: '/admin/seguro-hogar', label: 'Seguro de Hogar' },
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: compila; aparecen las rutas `/admin/seguro-hogar`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/seguro-hogar/ src/app/admin/AdminNav.tsx
git commit -m "feat(admin): ABM de solicitudes de Seguro de Hogar con estado"
```

---

### Task 5: Verificación integral (controlador) + env var

**Files:** ninguno

- [ ] **Step 1: Aplicar la migración a TEST**

```bash
cat supabase/.temp/project-ref   # debe ser icesuzwyfhcpaukserqt (test)
supabase link --project-ref icesuzwyfhcpaukserqt
supabase db push
```
Expected: `20260630000001_create_seguro_hogar_solicitudes` aplica sin error.

- [ ] **Step 2: Setear la env var en el entorno de testing**

`NEXT_PUBLIC_SEGURO_HOGAR_URL=https://solicitud.agi.previncaholding.com.ar/?ref=1` en el proyecto staging (scope Production). Recordar: es build-time → setear ANTES del build.

- [ ] **Step 3: Verificar el registro contra test**

Insertar una solicitud de prueba (simulando el server action) con un `plan` válido; confirmar que persiste; confirmar que el ABM lista y que el cambio de estado (`updateSeguroHogarStatus`) actualiza la fila. Confirmar que la tarjeta aparece para un activo y redirige; y que NO aparece si la env var no está seteada.

## Self-Review

- **Spec coverage:** tarjeta+modal activos-only → Task 3 (gate existente). Dos planes + cobertura completa + legal → Task 3 (constantes + modal). Registro con plan → Task 1+2+3. Tabla con estado → Task 1. ABM lista + estados → Task 4. URL configurable + card oculta → Task 3 (env gate). Migración → Task 1. Pruebas vs test → Task 5. Next 15.5.18 sin docs → Global Constraints. ✔ sin gaps. (Línea Blanca omitida a propósito; descarga de documentos fuera de alcance.)
- **Placeholder scan:** sin TBD/TODO; todo el código está completo.
- **Type consistency:** `registerSeguroHogarSolicitud(plan)` con plan `'hasta_1er_piso' | 'segundo_piso_plus'` consumido idéntico en Task 3. `updateSeguroHogarStatus(id, status)` con status `'pendiente'|'contactado'|'dado_de_alta'` consumido idéntico en StatusSelect (Task 4). Ítem usa los campos del `interface ServiceItem`. Estados y planes coinciden con los `check` de la migración (Task 1).
