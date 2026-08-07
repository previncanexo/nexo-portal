-- Interés / solicitudes de "Árbol de Vida" (Cochería Caramuto).
-- Mientras el producto está en "Próximamente" estas filas son una lista de espera:
-- el afiliado toca el botón y pedimos que lo avisen. Cuando exista la URL de
-- contratación, las mismas filas pasan a ser solicitudes de contratación.
-- Sin columna `plan`: el producto tiene un único plan ($4.500/mes).
create table public.arbol_vida_solicitudes (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  status text not null default 'pendiente' check (status in ('pendiente', 'contactado', 'dado_de_alta')),
  clicked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_arbol_vida_affiliate on public.arbol_vida_solicitudes(affiliate_id);
create index idx_arbol_vida_status on public.arbol_vida_solicitudes(status);

create trigger arbol_vida_updated_at
  before update on public.arbol_vida_solicitudes
  for each row execute function public.handle_updated_at();

alter table public.arbol_vida_solicitudes enable row level security;

create policy "arbol_vida: service role" on public.arbol_vida_solicitudes for all
  using (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
