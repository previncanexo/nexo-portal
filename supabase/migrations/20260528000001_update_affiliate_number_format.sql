-- Actualiza la generación de affiliate_number a numérico puro desde 1500
-- El número de certificado es correlativo incremental comenzando en 1500
-- El número de farmacia se calcula como: 289 + certificado(8 dígitos) + 00 + 00

create or replace function public.generate_affiliate_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(
    max(affiliate_number::integer), 1499
  ) + 1
  into next_num
  from public.affiliates
  where affiliate_number ~ '^[0-9]+$';

  new.affiliate_number := next_num::text;
  return new;
end;
$$ language plpgsql;
