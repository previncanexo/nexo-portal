// Argentina is always UTC-3 (no DST since 2000)
export function todayAR(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split('T')[0]
}

export function addOneMonth(dateStr: string | null): string {
  // Parse at local noon so the calendar day is never shifted by a timezone offset.
  const base = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const year = base.getFullYear()
  const monthIdx = base.getMonth() // 0-indexed month of the base date
  const day = base.getDate()
  // Advance exactly one month, rolling the year over after December.
  const targetYear = monthIdx === 11 ? year + 1 : year
  const targetMonthIdx = (monthIdx + 1) % 12
  // Clamp the day to the target month's length (e.g. Jan 31 -> Feb 28).
  const lastDay = new Date(targetYear, targetMonthIdx + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

// Format a date for display in Argentina.
// Accepts both plain calendar dates ("YYYY-MM-DD" — e.g. cobertura_desde,
// cobertura_hasta, fecha_nacimiento) and full ISO timestamps (created_at, paid_at).
//
// Calendar dates are rendered as-is, with NO timezone conversion: a bare
// "YYYY-MM-DD" parsed by `new Date()` is treated as UTC midnight, which in
// Argentina (UTC-3) would roll back to the previous day. Timestamps DO get
// converted to America/Argentina/Buenos_Aires so the Argentine wall-clock day
// is shown.
export function formatDateAR(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  if (!value) return '—'
  const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = isPlainDate ? new Date(value + 'T12:00:00Z') : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-AR', {
    ...options,
    timeZone: isPlainDate ? 'UTC' : 'America/Argentina/Buenos_Aires',
  })
}
