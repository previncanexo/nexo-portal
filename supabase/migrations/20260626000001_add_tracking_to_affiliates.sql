-- Identificadores de browser para Meta CAPI Purchase + GA4 Measurement Protocol
-- purchase server-side cuando el afiliado se activa (no estamos en el browser
-- en ese momento — necesitamos los IDs capturados en el PATCH).

-- IDs del browser para Meta CAPI + GA4 Purchase server-side. Viven en `leads`
-- (no en affiliates) porque pertenecen al evento de captación. El webhook
-- los lee vía leads.affiliate_id = affiliate.id.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS ga_client_id text,
  ADD COLUMN IF NOT EXISTS client_user_agent text,
  ADD COLUMN IF NOT EXISTS client_ip text;

-- Guard idempotente: el webhook puede entrar a 'authorized' Y a 'payment.approved'
-- para el mismo afiliado (MP no garantiza orden). Meta dedupea por event_id, GA4 no
-- — esta columna asegura que Purchase se dispare una sola vez.
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS purchase_event_sent_at timestamptz;

NOTIFY pgrst, 'reload schema';
