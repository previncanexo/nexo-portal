create or replace function public.set_farmacia_number()
returns trigger as $$
begin
  if new.affiliate_number is not null and new.affiliate_number ~ '^[0-9]+$' then
    new.farmacia_number := '289' || lpad(new.affiliate_number::integer::text, 8, '0') || '0000';
  end if;
  return new;
end;
$$ language plpgsql;

-- Fires AFTER affiliates_generate_number (alphabetical order: 'set' > 'generate')
create trigger affiliates_set_farmacia_number
before insert on public.affiliates
for each row
execute function public.set_farmacia_number();
