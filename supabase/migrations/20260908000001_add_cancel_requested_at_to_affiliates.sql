-- Cancelar la suscripción ya no cambia `status` inmediatamente ni desloguea.
-- La cobertura pagada corre hasta `cobertura_hasta` sin importar la cancelación.
-- Usamos esta columna para diferenciar "afiliado que canceló y está en período
-- de gracia" vs "afiliado activo" — sirve para banners suaves y ocultar el
-- botón "Cancelar" cuando ya se pidió.
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ;
