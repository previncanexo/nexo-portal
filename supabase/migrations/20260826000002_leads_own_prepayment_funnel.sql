-- ============================================================
-- El embudo pre-pago vive completo en `leads`
-- ============================================================
-- Antes: al terminar el formulario (PATCH /api/leads/[id]) se creaba ya un
-- `affiliate` en status='pending' con el checkout de MP colgado. Un afiliado
-- existía sin haber pagado nunca.
--
-- Ahora: el lead se queda con TODO el estado pre-pago (checkout, sub de MP,
-- avisos de abandono/rechazo). El `affiliate` se materializa recién cuando MP
-- confirma el pago, y desde ese momento su DNI/email quedan reservados.
--
-- Estados de lead:
--   partial    → formulario incompleto
--   completed  → formulario completo + checkout MP generado, sin pagar
--   converted  → pagó → tiene affiliate_id
--   abandoned  → el cron lo dio por perdido
-- ============================================================

alter table public.leads
  add column if not exists checkout_url text,
  add column if not exists mp_subscription_id text,
  add column if not exists mp_payer_id text,
  add column if not exists completed_at timestamptz,
  add column if not exists abandonment_notified_at timestamptz,
  add column if not exists rejection_notified_at timestamptz;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('partial', 'completed', 'converted', 'abandoned'));

create index if not exists idx_leads_mp_subscription_id on public.leads (mp_subscription_id);
create index if not exists idx_leads_dni on public.leads (dni);

-- Consulta del cron de abandono de pago.
create index if not exists idx_leads_completed_recovery
  on public.leads (created_at)
  where status = 'completed';

NOTIFY pgrst, 'reload schema';
