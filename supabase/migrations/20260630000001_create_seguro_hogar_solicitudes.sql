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
