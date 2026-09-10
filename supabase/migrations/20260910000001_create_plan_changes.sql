-- Idempotente y transaccional a proposito: esta migracion se aplica a mano
-- (`supabase db push`, o copiada al SQL editor de Supabase). Sin el begin/commit,
-- un fallo a mitad de camino deja la tabla a medio crear y el siguiente intento
-- choca contra objetos que ya existen; con `if not exists` + transaccion, volver
-- a correrla es seguro y no deja estados intermedios.
begin;

-- Registra la INTENCIÓN de un afiliado de cambiar de plan. Crear una fila acá NO
-- toca `affiliates.plan_id`: la decisión de producto (ver `src/lib/cambio-de-plan.ts`
-- para las reglas, y la server action + webhook de una tanda posterior para el flujo
-- completo) es que el cambio se aplica recién en el PRÓXIMO CICLO DE FACTURACIÓN,
-- cuando Mercado Pago cobra el monto del plan nuevo y el webhook confirma ese pago.
--
-- Por qué no al instante: si alguien pagó $20.000 y baja a Nexo III hoy, cambiarle
-- la cobertura ahora le saca algo que ya pagó. Si sube, se lleva más cobertura de
-- la que pagó. Aplicar en el próximo ciclo evita tener que prorratear, que es
-- justo donde se cobra mal.
create table if not exists public.plan_changes (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  -- Nullable: el afiliado legacy ("Plan Base Nexo", renombrado a "Nexo I" y
  -- desactivado por 20260901000001_add_slug_and_nexo_plans.sql) puede llegar acá
  -- sin un plan actual resuelto de forma inequívoca. Se registra el cambio igual:
  -- `to_plan_id` es el único dato que el webhook necesita para aplicarlo.
  from_plan_id uuid references public.plans(id),
  to_plan_id uuid not null references public.plans(id),
  status text not null default 'pendiente' check (status in ('pendiente', 'aplicado', 'fallido', 'cancelado')),
  -- Qué contestó Mercado Pago al pedir el cambio de monto de la suscripción:
  -- 'monto_actualizado', 'requiere_checkout', o el mensaje de error si falló.
  mp_resultado text,
  requested_at timestamptz not null default now(),
  applied_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Un afiliado no puede tener dos cambios 'pendiente' al mismo tiempo: si los
-- tuviera, el webhook no tendría forma de saber cuál de los dos aplicar cuando
-- llegue el pago del próximo ciclo, y acá hay plata de por medio (se le cobraría
-- o se le acreditaría el plan equivocado). El índice único parcial solo mira
-- status = 'pendiente', así que un afiliado puede acumular historial de cambios
-- 'aplicado' / 'cancelado' / 'fallido' sin límite.
create unique index if not exists idx_plan_changes_pendiente_unico
  on public.plan_changes(affiliate_id)
  where status = 'pendiente';

create index if not exists idx_plan_changes_affiliate on public.plan_changes(affiliate_id);

drop trigger if exists plan_changes_updated_at on public.plan_changes;
create trigger plan_changes_updated_at
  before update on public.plan_changes
  for each row execute function public.handle_updated_at();

alter table public.plan_changes enable row level security;

-- El afiliado nunca lee ni escribe esta tabla directamente: la server action que
-- pide el cambio y el webhook que lo aplica corren con la service role. Mismo
-- patrón que `seguro_hogar_solicitudes` (20260630000001_create_seguro_hogar_solicitudes.sql).
drop policy if exists "plan_changes: service role" on public.plan_changes;
create policy "plan_changes: service role" on public.plan_changes for all
  using (auth.role() = 'service_role');

commit;

NOTIFY pgrst, 'reload schema';
