-- ============================================================
-- LEADS — carga diferida en dos etapas durante el onboarding
-- Stage 1: datos básicos al pasar el step 2 del onboarding
-- Stage 2: datos completos antes del resumen → promueve a affiliate
-- ============================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),

  -- Stage 1 (obligatorios)
  para_quien text not null check (para_quien in ('para_mi', 'otra_persona')),
  nombre text not null,
  apellido text not null,
  email text not null,
  whatsapp text not null,

  -- Stage 2 (se completan al finalizar el form)
  dni text,
  fecha_nacimiento date,
  ciudad text,
  domicilio text,
  medio_pago text check (medio_pago in ('tarjeta', 'mp_balance')),
  mp_email text,
  plan_id uuid references public.plans(id) on delete set null,

  -- Promoción a affiliate
  status text not null default 'partial' check (status in ('partial', 'converted', 'abandoned')),
  affiliate_id uuid references public.affiliates(id) on delete set null,

  -- Tracking de origen
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referer text,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_email on public.leads(email);
create index idx_leads_status on public.leads(status);
create index idx_leads_affiliate_id on public.leads(affiliate_id);
create index idx_leads_created_at on public.leads(created_at desc);

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.leads enable row level security;

create policy "Leads: service role" on public.leads for all
  using (auth.role() = 'service_role');
