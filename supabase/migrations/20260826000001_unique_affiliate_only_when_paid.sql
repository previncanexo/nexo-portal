-- ============================================================
-- Unicidad de afiliado: SOLO una vez pagado
-- ============================================================
-- Antes: affiliates.dni y affiliates.email eran UNIQUE sin condición.
-- Como el onboarding crea el affiliate en status='pending' ANTES del pago,
-- un lead abandonado dejaba el DNI/email bloqueado para siempre: la persona
-- no podía volver a intentar el alta.
--
-- Ahora: pueden coexistir N afiliados 'pending' con los mismos datos
-- (mismo DNI, mismo email). La unicidad se aplica solo sobre los que
-- efectivamente pagaron → status 'active' o 'suspended'.
--
-- 'cancelled' queda FUERA del índice a propósito: quien se dio de baja
-- puede volver a afiliarse sin chocar con su registro histórico.
-- ============================================================

alter table public.affiliates drop constraint if exists affiliates_dni_key;
alter table public.affiliates drop constraint if exists affiliates_email_key;

create unique index if not exists affiliates_dni_paid_key
  on public.affiliates (dni)
  where status in ('active', 'suspended');

create unique index if not exists affiliates_email_paid_key
  on public.affiliates (email)
  where status in ('active', 'suspended');

-- Los UNIQUE viejos servían además como índice de búsqueda; los reponemos.
create index if not exists idx_affiliates_dni on public.affiliates (dni);
create index if not exists idx_affiliates_email on public.affiliates (email);
