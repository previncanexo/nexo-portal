-- ============================================================
-- Generar número de certificado + farmacia SOLO al confirmar el pago
-- ============================================================
-- Antes: el número de certificado (affiliate_number) se asignaba por un trigger
-- BEFORE INSERT (generate_affiliate_number), o sea al CREAR el afiliado — incluido
-- el registro en estado 'pending', ANTES de que Mercado Pago confirmara el pago.
-- Esto desordenaba la sincronización con MP / Previnca y "quemaba" números en
-- pendientes que nunca pagaban.
--
-- Ahora: el número (certificado + farmacia) se genera cuando el afiliado pasa a
-- 'active' (pago confirmado o activación desde admin) y todavía no tiene número.
-- Pendiente / rechazado / cancelado nunca llegan a 'active' → nunca reciben número.

-- 1) Quitar los triggers que generaban el número al crear el afiliado
drop trigger if exists affiliates_generate_number on public.affiliates;
drop trigger if exists affiliates_set_farmacia_number on public.affiliates;

-- 2) Función: asigna certificado + farmacia cuando el afiliado está/pasa a 'active'
--    y aún no tiene número. Correlativo incremental: max(actual) + 1, mínimo 1500.
create or replace function public.assign_affiliate_number_on_active()
returns trigger as $$
declare
  next_num integer;
begin
  if new.status = 'active'
     and (new.affiliate_number is null or new.affiliate_number = '') then
    select coalesce(max(affiliate_number::integer), 1499) + 1
      into next_num
      from public.affiliates
      where affiliate_number ~ '^[0-9]+$';
    new.affiliate_number := next_num::text;
    new.farmacia_number  := '289' || lpad(next_num::text, 8, '0') || '0000';
  end if;
  return new;
end;
$$ language plpgsql;

-- 3) Trigger BEFORE INSERT OR UPDATE:
--    - INSERT con status='active' (alta manual directa de admin) → genera número.
--    - UPDATE pending→active (pago confirmado / activación) → genera número.
--    - Re-activaciones (suspended→active con número existente) → no toca el número.
drop trigger if exists affiliates_assign_number_on_active on public.affiliates;
create trigger affiliates_assign_number_on_active
  before insert or update on public.affiliates
  for each row
  execute function public.assign_affiliate_number_on_active();
