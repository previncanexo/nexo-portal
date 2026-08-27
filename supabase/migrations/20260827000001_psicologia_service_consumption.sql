-- Psicología On Demand: la primera sesión tiene precio promocional ($15.000).
-- A partir de la segunda vale el precio de lista ($30.000).
--
-- El cobro ocurre en DOC24, fuera del portal, así que no tenemos forma automática
-- de saber quién contrató. La promo se marca manualmente desde el panel admin y
-- se registra como un consumo en la tabla que ya existía para topes de servicios.

alter table public.service_consumptions
  drop constraint if exists service_consumptions_service_type_check;

alter table public.service_consumptions
  add constraint service_consumptions_service_type_check
  check (service_type in ('doc24', 'urgencias', 'farmacia', 'odontologia', 'psicologia'));

-- El portal consulta "¿este afiliado ya consumió psicología?" en cada carga.
create index if not exists idx_consumptions_affiliate_service
  on public.service_consumptions(affiliate_id, service_type);

NOTIFY pgrst, 'reload schema';
