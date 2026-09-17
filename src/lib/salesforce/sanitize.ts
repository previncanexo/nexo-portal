/**
 * Sanitización de campos antes de mandarlos a Salesforce.
 *
 * La org SF UAT rechaza payloads con caracteres no ASCII en `email`
 * (verificado empíricamente 2026-09-17: "maría.gonzález@...` responde
 * `INVALID_EMAIL_ADDRESS`). Como los nombres reales en AR pueden tener
 * tildes / ñ / acentos, normalizamos ANTES de mandar.
 *
 * Los campos de texto libre (firstName, lastName, address.street, city)
 * SÍ conservan tildes — SF solo se queja en `email`. Pero también les
 * hacemos trim + colapso de whitespace por prolijidad.
 */

/**
 * Descompone caracteres Unicode y remueve los diacríticos (acentos, ñ→n).
 * `María` → `Maria`, `López` → `Lopez`, `Ñoño` → `Nono`.
 * Preserva el resto del string tal cual (espacios, mayúsculas).
 */
export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // La ñ NFD queda `ñ` — la línea de arriba ya la maneja.
    // Pero por si viene algún carácter compuesto raro que no se descompone,
    // hacemos un pass adicional para casos comunes.
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
}

/**
 * Normaliza un email para SF: lowercase, trim, sin tildes ni ñ.
 * Devuelve null si el input es vacío.
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = String(input).trim()
  if (!trimmed) return null
  return stripDiacritics(trimmed).toLowerCase()
}

/**
 * Normaliza un teléfono: solo dígitos + colapso whitespace.
 * MP AR usa formato 10-13 dígitos; SF acepta hasta 40 chars.
 */
export function sanitizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/\D/g, '')
  return digits || null
}

/**
 * Text libre: trim + colapso de espacios múltiples. Conserva tildes/ñ
 * (SF los acepta en campos que no son email).
 */
export function sanitizeText(input: string | null | undefined, maxLength?: number): string | null {
  if (!input) return null
  const cleaned = String(input).trim().replace(/\s+/g, ' ')
  if (!cleaned) return null
  return maxLength ? cleaned.slice(0, maxLength) : cleaned
}

/**
 * DNI: solo dígitos. Trunca a lo que MP/SF acepten (SF max 20).
 */
export function sanitizeDni(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/\D/g, '')
  return digits || null
}

/**
 * Fecha ISO YYYY-MM-DD. Valida formato mínimo, no valida rango.
 * Devuelve null si no matchea el patrón.
 */
export function sanitizeDate(input: string | null | undefined): string | null {
  if (!input) return null
  const s = String(input).trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
