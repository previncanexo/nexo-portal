# Psicología On Demand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar al portal una tarjeta de servicio "Psicología On Demand" (solo afiliados activos) que muestra el costo y un aviso de "se cobra aparte", registra el clic, y redirige a una plataforma externa configurable.

**Architecture:** Una migración crea `psicologia_clicks`. Una server action registra el clic (best-effort). En `ServiceCards.tsx` se agrega un ícono, un modal dedicado y un ítem de servicio condicionado a la env var; el botón "Reservar turno" es un enlace nativo que registra el clic en fire-and-forget y abre la URL externa.

**Tech Stack:** Next.js App Router (server actions + client components), Supabase, Tailwind/estilos inline existentes.

## Global Constraints

- **Next.js con breaking changes (AGENTS.md):** antes de escribir server actions o client components, leer la guía relevante en `node_modules/next/dist/docs/`. No asumir APIs de memoria.
- No agregar dependencias nuevas.
- Gate de verificación: `npm run build` (typecheck). `npm run lint` está ROTO a nivel proyecto (ESLint 9 flat-config) — NO usarlo ni intentar arreglarlo.
- Sin test runner → verificación integral contra el proyecto Supabase **de test** (`nexo-portal-test`), nunca prod.
- Env var: `NEXT_PUBLIC_PSICOLOGIA_URL`. Si no está seteada, la tarjeta NO se renderiza.
- Precio: constante `PSICOLOGIA_PRECIO = 30000`.
- Redirección: enlace nativo `<a href={URL} target="_blank" rel="noopener noreferrer">` + registro del clic en fire-and-forget (sin `await` que bloquee la apertura).
- Solo afiliados activos: el gate ya existe (`ServiceCards` se renderiza solo cuando `isActive` en `portal/page.tsx`). No agregar lógica de permisos.
- Estilo: seguir el patrón visual existente de `ServiceCards.tsx` (glass-card, gradiente `--purple`/`--pink`, `--font-dm-sans`).
- Commits: conventional commits, sin atribución AI.

## File Structure

- Create: `supabase/migrations/20260629000002_create_psicologia_clicks.sql`
- Modify: `src/app/portal/actions.ts` — agregar `registerPsicologiaClick`.
- Modify: `src/app/portal/ServiceCards.tsx` — ícono + modal + ítem de servicio + handleAction + render del modal.

---

### Task 1: Migración — tabla psicologia_clicks

**Files:**
- Create: `supabase/migrations/20260629000002_create_psicologia_clicks.sql`

**Interfaces:**
- Produces: tabla `psicologia_clicks (id uuid, affiliate_id uuid, clicked_at timestamptz)`.

- [ ] **Step 1: Escribir la migración**

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

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Commit** (la aplicación a la DB de test la hace el controlador en la fase de verificación)

```bash
git add supabase/migrations/20260629000002_create_psicologia_clicks.sql
git commit -m "feat(db): tabla psicologia_clicks"
```

---

### Task 2: Server action registerPsicologiaClick

**Files:**
- Modify: `src/app/portal/actions.ts` (agregar al final del archivo)

**Interfaces:**
- Consumes: tabla `psicologia_clicks` (Task 1); `createClient` (async, ya importado), `createAdminClient` (ya importado).
- Produces: `registerPsicologiaClick(): Promise<void>` — best-effort, nunca tira.

- [ ] **Step 1: Leer la guía de Next.js para server actions**

Run: `ls node_modules/next/dist/docs/ && grep -rl "server action\|use server" node_modules/next/dist/docs/ | head`
Leer la guía relevante antes de escribir la action.

- [ ] **Step 2: Agregar la action** (al final de `src/app/portal/actions.ts`)

El archivo ya tiene `'use server'`, `import { createClient } from '@/lib/supabase/server'` y `import { createAdminClient } from '@/lib/supabase/admin'`. Reusarlos.

```typescript
// Registro best-effort del interés en Psicología On Demand.
// No debe interrumpir la redirección: si falla, solo loguea.
export async function registerPsicologiaClick(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    await admin.from('psicologia_clicks').insert({
      affiliate_id: affiliate?.id ?? null,
    })
  } catch (err) {
    console.error('[psicologia-click]', err)
  }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compila sin errores de tipo.

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/actions.ts
git commit -m "feat(portal): server action para registrar clic de psicologia"
```

---

### Task 3: Tarjeta + modal de Psicología On Demand

**Files:**
- Modify: `src/app/portal/ServiceCards.tsx`

**Interfaces:**
- Consumes: `registerPsicologiaClick` (Task 2).
- Produces: tarjeta nueva visible para activos cuando `NEXT_PUBLIC_PSICOLOGIA_URL` está seteada.

- [ ] **Step 1: Leer la guía de Next.js para client components**

Run: `grep -rl "use client\|client component" node_modules/next/dist/docs/ | head`
Leer la guía relevante (esta versión de Next puede diferir).

- [ ] **Step 2: Importar la server action y definir constantes**

En `src/app/portal/ServiceCards.tsx`, al top (después de los imports existentes, línea ~4), agregar:

```typescript
import { registerPsicologiaClick } from './actions'

const PSICOLOGIA_URL = process.env.NEXT_PUBLIC_PSICOLOGIA_URL
const PSICOLOGIA_PRECIO = 30000
```

- [ ] **Step 3: Agregar el ícono** (junto a los otros `function IconX()`, ~línea 28)

```typescript
function IconPsicologia() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a4.5 4.5 0 0 0-4.4 5.5A4 4 0 0 0 4 13a4 4 0 0 0 3 3.9V19a2 2 0 0 0 4 0V4.5A2.5 2.5 0 0 0 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5V19a2 2 0 0 0 4 0v-2.1A4 4 0 0 0 20 13a4 4 0 0 0-1.1-5.5A4.5 4.5 0 0 0 14.5 2Z" />
    </svg>
  )
}
```

- [ ] **Step 4: Agregar el modal `PsicologiaModal`** (junto a `ServiceInfoModal`, ~línea 157)

Mismo estilo que `ServiceInfoModal`, con costo, aviso y botón "Reservar turno" como enlace nativo:

```typescript
function PsicologiaModal({ service, onClose }: { service: ServiceItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5,2,25,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
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

        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-dm-sans)' }}>{service.description}</p>
          <ul className="flex flex-col gap-2.5">
            {service.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-sm mt-px shrink-0" style={{ color: 'var(--pink)' }}>✔</span>
                <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.68)', fontFamily: 'var(--font-dm-sans)' }}>{bullet}</span>
              </li>
            ))}
          </ul>

          {/* Costo */}
          <div className="rounded-2xl px-4 py-3 flex items-baseline justify-between" style={{ background: 'rgba(134,96,239,0.12)', border: '1px solid rgba(134,96,239,0.22)' }}>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>Costo por consulta</span>
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>${PSICOLOGIA_PRECIO.toLocaleString('es-AR')}</span>
          </div>

          {/* Aviso */}
          <p className="text-xs leading-relaxed rounded-xl px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-dm-sans)' }}>
            Servicio adicional. Se cobra aparte de tu cobertura Nexo.
          </p>
        </div>

        <div className="px-5 pb-6 pt-1 flex flex-col gap-2">
          <a
            href={PSICOLOGIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { void registerPsicologiaClick() }}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-center transition-opacity active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}
          >
            Reservar turno
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity active:scale-95"
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

- [ ] **Step 5: Agregar el ítem de servicio** (dentro del array `services`, ~línea 361, condicionado a la env var)

Agregar al final del array, antes del `]`:

```typescript
    ...(PSICOLOGIA_URL
      ? [{
          id: 'psicologia',
          title: 'Psicología On Demand',
          subtitle: 'Sesiones con profesionales, a tu ritmo',
          badge: 'Pago aparte',
          badgeColor: '#d97706',
          badgeBg: 'rgba(217,119,6,0.10)',
          buttonLabel: 'Ver y reservar',
          buttonAction: 'modal' as const,
          accentColor: 'white',
          accentBg: 'rgba(134,96,239,0.10)',
          glowColor: 'rgba(217,119,6,0.14)',
          Icon: IconPsicologia,
          description: 'Accedé a sesiones de psicología con profesionales, de forma simple y online. Es un servicio adicional, independiente de tu cobertura Nexo, que se abona por separado.',
          bullets: [
            'Sesiones con profesionales',
            'Reservás tu turno online',
            'Servicio adicional, se cobra aparte',
          ],
        }]
      : []),
```

- [ ] **Step 6: Agregar el estado y el branch en handleAction**

Junto a los otros `useState` de modales del componente, agregar:
```typescript
  const [psicologiaModalOpen, setPsicologiaModalOpen] = useState(false)
```

En `handleAction` (~línea 458), agregar el branch para psicología (antes del `else if (service.id === 'urgencias')` o dentro de la rama 'modal'):
```typescript
    if (service.buttonAction === 'info') {
      setInfoService(service)
    } else if (service.buttonAction === 'modal') {
      if (service.id === 'psicologia') setPsicologiaModalOpen(true)
      else if (service.id === 'urgencias') setUrgenciasModalOpen(true)
      else setFarmaciaModalOpen(true)
    } else if (service.buttonAction === 'tel' && service.buttonHref) {
      window.location.href = service.buttonHref
    } else if (service.buttonHref) {
      window.open(service.buttonHref, '_blank', 'noopener,noreferrer')
    }
```

- [ ] **Step 7: Renderizar el modal** (junto a los otros modales condicionales del return, p. ej. donde se rendiza `{infoService && <ServiceInfoModal .../>}`)

```typescript
      {psicologiaModalOpen && (
        <PsicologiaModal
          service={services.find((s) => s.id === 'psicologia')!}
          onClose={() => setPsicologiaModalOpen(false)}
        />
      )}
```

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: compila sin errores de tipo.

- [ ] **Step 9: Commit**

```bash
git add src/app/portal/ServiceCards.tsx
git commit -m "feat(portal): tarjeta Psicologia On Demand con modal y registro de clic"
```

---

### Task 4: Verificación integral (controlador) + env var

**Files:** ninguno (verificación + configuración)

- [ ] **Step 1: Aplicar la migración a TEST**

Confirmar link a test y aplicar:
```bash
cat supabase/.temp/project-ref   # debe ser icesuzwyfhcpaukserqt (test)
supabase link --project-ref icesuzwyfhcpaukserqt
supabase db push
```
Expected: `20260629000002_create_psicologia_clicks` aplica sin error.

- [ ] **Step 2: Setear la env var en el entorno de testing de Vercel**

`NEXT_PUBLIC_PSICOLOGIA_URL=https://test-doctorprevinca.videoconsultas.app/paciente/autogestion` en el scope de Preview/testing.

- [ ] **Step 3: Verificar el registro del clic contra test**

Con un afiliado activo de prueba, abrir el portal, tocar "Psicología On Demand" → "Reservar turno". Confirmar (vía DB de test) que se insertó una fila en `psicologia_clicks` con el `affiliate_id` correcto, y que se abrió la URL externa en pestaña nueva. Confirmar que el flujo NO rompe el resto del portal.

- [ ] **Step 4: Verificar la degradación**

Sin `NEXT_PUBLIC_PSICOLOGIA_URL` seteada, confirmar que la tarjeta NO aparece.

## Self-Review

- **Spec coverage:** Tarjeta+modal activos-only → Task 3 (gate existente). Aviso de costo + "se cobra aparte" → Task 3 Step 4. Registro de clic → Task 1 + Task 2 + Task 3 (onClick). URL configurable + card oculta si falta → Task 3 Steps 2/5. Migración → Task 1. Pruebas contra test → Task 4. Next.js docs → Global Constraints + Tasks 2/3 Step 1. ✔ sin gaps.
- **Placeholder scan:** sin TBD/TODO; todo el código está completo.
- **Type consistency:** `registerPsicologiaClick(): Promise<void>` consumido idéntico en Task 3. `buttonAction: 'modal' as const` para no romper el union type. El ítem usa exactamente los campos del `interface ServiceItem`.
