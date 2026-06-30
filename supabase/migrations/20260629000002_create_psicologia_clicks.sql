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
