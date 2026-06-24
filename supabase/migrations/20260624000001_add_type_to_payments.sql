-- Distingue cobros ('payment') de notas de crédito por devolución ('refund').
-- Default 'payment' deja a los INSERTs existentes funcionando sin cambios;
-- solo refundLastPayment() setea explícitamente 'refund'.
-- Backfill: los rows con amount<0 son devoluciones generadas por el botón
-- de devolución del admin antes de esta migración.

ALTER TABLE public.payments
  ADD COLUMN type text NOT NULL DEFAULT 'payment'
  CHECK (type IN ('payment', 'refund'));

UPDATE public.payments SET type = 'refund' WHERE amount < 0;

NOTIFY pgrst, 'reload schema';
