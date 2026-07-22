/**
 * Helpers de periodo para el admin. Módulo neutro (no 'use client')
 * para que Server Components puedan llamar parsePeriodParams()
 * durante la query.
 */

export type Preset = '7d' | '15d' | '1m' | '6m' | '1y' | 'custom'

export const PRESETS: { value: Preset; label: string; days: number }[] = [
  { value: '7d',    label: '7 días',   days: 7 },
  { value: '15d',   label: '15 días',  days: 15 },
  { value: '1m',    label: '1 mes',    days: 30 },
  { value: '6m',    label: '6 meses',  days: 180 },
  { value: '1y',    label: '1 año',    days: 365 },
]

/** Parsea from/to de searchParams. Si no hay params, devuelve el rango del
 *  preset (default: últimos 6 meses). */
export function parsePeriodParams(
  searchParams: { from?: string; to?: string; preset?: string } | undefined
): { from: Date; to: Date; preset: Preset } {
  const preset = (searchParams?.preset as Preset) ?? '6m'
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  if (searchParams?.from && searchParams?.to) {
    return {
      from: new Date(searchParams.from + 'T00:00:00'),
      to: new Date(searchParams.to + 'T23:59:59'),
      preset: 'custom',
    }
  }

  const days = PRESETS.find((p) => p.value === preset)?.days ?? 180
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)
  return { from, to: now, preset }
}
