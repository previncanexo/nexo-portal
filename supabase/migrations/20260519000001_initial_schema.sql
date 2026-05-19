-- ============================================================
-- NEXO BY PREVINCA — Schema inicial MVP
-- ============================================================

-- ============================================================
-- PLANES
-- ============================================================
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.plans (name, price, description) values
  ('Plan Base Nexo', 19500, 'Teleconsultas DOC24 · Urgencias 24/7 · Descuentos 50% farmacia · Guardia odontológica');

-- ============================================================
-- AFILIADOS
-- ============================================================
create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  dni text not null unique,
  email text not null unique,
  whatsapp text,
  ciudad text,
  fecha_nacimiento date,
  plan_id uuid references public.plans(id),
  affiliate_number text unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'cancelled')),
  cobertura_desde date,
  cobertura_hasta date,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAGOS
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete cascade,
  mp_payment_id text unique,
  mp_preference_id text,
  mp_status text,
  amount integer not null,
  currency text default 'ARS',
  period_from date,
  period_to date,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- CONSUMOS DE SERVICIOS (para topes — activar con DOC24 en V2)
-- ============================================================
create table public.service_consumptions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete cascade,
  service_type text not null check (service_type in ('doc24', 'urgencias', 'farmacia', 'odontologia')),
  consumed_at timestamptz default now(),
  notes text
);

-- ============================================================
-- TRIGGERS
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger affiliates_updated_at
  before update on public.affiliates
  for each row execute function public.handle_updated_at();

create or replace function public.generate_affiliate_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(
    max(substring(affiliate_number from 'NXO-([0-9]+)')::integer), 0
  ) + 1
  into next_num
  from public.affiliates
  where affiliate_number like 'NXO-%';

  new.affiliate_number := 'NXO-' || lpad(next_num::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger affiliates_generate_number
  before insert on public.affiliates
  for each row
  when (new.affiliate_number is null)
  execute function public.generate_affiliate_number();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.affiliates enable row level security;
alter table public.payments enable row level security;
alter table public.service_consumptions enable row level security;
alter table public.plans enable row level security;

create policy "Plans: public read"
  on public.plans for select using (true);

create policy "Affiliates: own record"
  on public.affiliates for select
  using (auth.uid() = user_id);

create policy "Affiliates: service role"
  on public.affiliates for all
  using (auth.role() = 'service_role');

create policy "Payments: own records"
  on public.payments for select
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = auth.uid()
    )
  );

create policy "Payments: service role"
  on public.payments for all
  using (auth.role() = 'service_role');

create policy "Consumptions: own records"
  on public.service_consumptions for select
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = auth.uid()
    )
  );

create policy "Consumptions: service role"
  on public.service_consumptions for all
  using (auth.role() = 'service_role');

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_affiliates_email on public.affiliates(email);
create index idx_affiliates_dni on public.affiliates(dni);
create index idx_affiliates_user_id on public.affiliates(user_id);
create index idx_affiliates_status on public.affiliates(status);
create index idx_payments_affiliate_id on public.payments(affiliate_id);
create index idx_payments_mp_id on public.payments(mp_payment_id);
create index idx_consumptions_affiliate on public.service_consumptions(affiliate_id, consumed_at);
