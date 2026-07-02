-- Guarda el payer_id de MP asociado al afiliado.
-- Necesario para trazabilidad cuando el email/DNI del pagador difiere del
-- afiliado (ej: "para otra persona"). El webhook lo obtiene del primer pago
-- de la sub y lo guarda al activar.

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS mp_payer_id bigint;

NOTIFY pgrst, 'reload schema';
