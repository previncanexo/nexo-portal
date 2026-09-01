-- Identificador estable de plan para consumidores externos (la landing).
-- La landing es SSG puro y no habla con Supabase: necesita un id legible y
-- versionable en su propio código, no un UUID que tendría que resolver en build.
alter table public.plans add column if not exists slug text unique;

-- La tabla plans nunca tuvo updated_at en las migraciones, pero
-- admin/planes/actions.ts se la escribe en cada create y update. O se agrego a
-- mano en el panel (migraciones desincronizadas) o el ABM de planes viene
-- fallando en silencio. Se agrega de forma idempotente: si ya existia, no-op.
alter table public.plans add column if not exists updated_at timestamptz default now();

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- Grandfathering: la fila del plan actual CONSERVA su precio ($19.500). Solo se
-- renombra, para que el socio que ya paga vea el nombre correcto del producto en
-- su credencial (CredentialCard.tsx:103), y se desactiva para que no aparezca en
-- el alta. Queda sin slug a propósito: sin slug no se puede contratar.
--
-- La description distingue esta fila legacy de la nueva 'Nexo I' ($20.000) que
-- inserta el bloque de abajo: sin esto, /admin/planes mostraria dos filas
-- "Nexo I" indistinguibles a simple vista. La credencial del socio (que solo lee
-- `name`) no se ve afectada.
--
-- El match es por nombre, asi que si el plan legacy fue renombrado a mano el
-- update afectaria 0 filas EN SILENCIO y quedaria activo a $19.500 en el alta.
-- Sobre datos de afiliados reales preferimos abortar y que alguien mire.
do $$
declare
  filas int;
begin
  update public.plans
     set name = 'Nexo I', is_active = false, description = 'Plan anterior · $19.500'
   where name = 'Plan Base Nexo';
  get diagnostics filas = row_count;

  if filas = 0 then
    -- Puede ser una re-corrida (ya renombrado) o que el legacy tenga otro nombre.
    -- El predicado identifica al legacy YA MIGRADO por nombre + sin slug: el
    -- insert de abajo siempre pone slug, asi que el UNICO "Nexo I" sin slug
    -- posible es este legacy ya migrado. Sin el precio en el predicado a
    -- proposito (a diferencia de una version anterior de esta migracion): el
    -- ABM permite editar el precio del legacy desde /admin/planes, y atar la
    -- idempotencia a ese valor mutable convertiria un cambio de precio legitimo
    -- en un aborto en falso de una segunda corrida.
    if not exists (
      select 1 from public.plans
       where name = 'Nexo I' and slug is null
    ) then
      raise exception 'No se encontro el plan legacy "Plan Base Nexo" ni un legacy ya migrado. Revisar la tabla plans a mano antes de continuar.';
    end if;
  elsif filas > 1 then
    raise exception 'Se esperaba renombrar exactamente 1 plan legacy, se afectaron %', filas;
  end if;
end $$;

insert into public.plans (slug, name, price, description, is_active) values
  ('nexo-1', 'Nexo I',   20000, 'Emergencias · Guardia odontológica · Farmacia · Doc24', true),
  ('nexo-2', 'Nexo II',  12000, 'Seguro de Salud I · Farmacia · Óptica · Doc24',         true),
  ('nexo-3', 'Nexo III',  7000, 'Seguro de Salud II · Óptica · Doc24',                   true)
on conflict (slug) do nothing;
