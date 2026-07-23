-- Atribución completa de campaña: UTM extendidos (term, content) + click IDs
-- (fbclid, gclid) + URL de aterrizaje. Se persisten en `leads` para mantener
-- la simetría con el resto del tracking (leads.affiliate_id vincula al pago).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS landing_url text;

NOTIFY pgrst, 'reload schema';
