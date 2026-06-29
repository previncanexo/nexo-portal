-- Campos para recuperación de abandono y notificación de rechazo.
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS abandonment_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_notified_at timestamptz;

-- Índice parcial para la consulta del cron de abandono de pago.
CREATE INDEX IF NOT EXISTS idx_affiliates_pending_recovery
  ON public.affiliates (created_at)
  WHERE status = 'pending';

NOTIFY pgrst, 'reload schema';
