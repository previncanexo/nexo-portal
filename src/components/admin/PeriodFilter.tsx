'use client'

/**
 * Selector de periodo global para el admin.
 *
 * Escribe el rango elegido en la URL como query params (`from`, `to`) y
 * hace router.refresh() para que el Server Component vuelva a hacer la
 * query con los datos filtrados. Los presets (7d, 15d, 1m, 6m, 1y) se
 * traducen internamente a from/to y el date range picker permite rango
 * custom.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PRESETS, type Preset } from './period-utils'

function isoDay(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Calcula from/to en ISO (yyyy-mm-dd) según el preset (relativo a hoy). */
function presetToRange(preset: Preset): { from: string; to: string } {
  const today = new Date()
  const to = isoDay(today)
  if (preset === 'today') return { from: to, to }
  const days = PRESETS.find((p) => p.value === preset)?.days ?? 180
  const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
  return { from: isoDay(fromDate), to }
}

export default function PeriodFilter({ defaultPreset = '6m' }: { defaultPreset?: Preset }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estado inicial: leer from/to de la URL si existen; si no, usar el default preset.
  const urlFrom = searchParams.get('from')
  const urlTo = searchParams.get('to')
  const urlPreset = searchParams.get('preset') as Preset | null

  const [preset, setPreset] = useState<Preset>(urlPreset ?? (urlFrom || urlTo ? 'custom' : defaultPreset))
  const [from, setFrom] = useState(urlFrom ?? '')
  const [to, setTo] = useState(urlTo ?? '')

  // Al montar sin params, sembrar la URL con el rango del default preset — sin
  // triggerar refetch (los server components ya ven la ausencia de params).
  useEffect(() => {
    if (!urlFrom && !urlTo && !urlPreset) {
      const range = presetToRange(defaultPreset)
      setFrom(range.from)
      setTo(range.to)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyRange(nextFrom: string, nextTo: string, nextPreset: Preset) {
    const sp = new URLSearchParams(Array.from(searchParams.entries()))
    if (nextFrom) sp.set('from', nextFrom); else sp.delete('from')
    if (nextTo) sp.set('to', nextTo); else sp.delete('to')
    sp.set('preset', nextPreset)
    router.push(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  function handlePresetClick(p: Preset) {
    const range = presetToRange(p)
    setPreset(p)
    setFrom(range.from)
    setTo(range.to)
    applyRange(range.from, range.to, p)
  }

  function handleDateChange(which: 'from' | 'to', value: string) {
    const nextFrom = which === 'from' ? value : from
    const nextTo = which === 'to' ? value : to
    if (which === 'from') setFrom(value); else setTo(value)
    setPreset('custom')
    applyRange(nextFrom, nextTo, 'custom')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
      {/* Mitad izquierda: label PERIODO + chips */}
      <div className="period-card" style={{ height: 48, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a08af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Periodo
          </span>
        </div>
        <div className="chip-group" style={{ flex: 1, height: '100%', boxSizing: 'border-box' }}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePresetClick(p.value)}
              className={preset === p.value ? 'active' : ''}
              style={{ flex: 1 }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mitad derecha: date range full-width */}
      <div className="chip-group" style={{ alignItems: 'stretch', width: '100%', height: 48, padding: 4, boxSizing: 'border-box' }}>
        <input
          type="date"
          value={from}
          onChange={(e) => handleDateChange('from', e.target.value)}
          aria-label="Desde"
          style={{ flex: 1, backgroundColor: 'transparent', backgroundImage: 'none', border: 'none', padding: '0 16px', textAlign: 'center', color: 'rgba(255,255,255,0.90)', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-dm-sans)', colorScheme: 'dark' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '0 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transform: 'translateY(-3px)' }}>→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => handleDateChange('to', e.target.value)}
          aria-label="Hasta"
          style={{ flex: 1, backgroundColor: 'transparent', backgroundImage: 'none', border: 'none', padding: '0 16px', textAlign: 'center', color: 'rgba(255,255,255,0.90)', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-dm-sans)', colorScheme: 'dark' }}
        />
      </div>
    </div>
  )
}

// parsePeriodParams se movió a ./period-utils para que Server Components
// puedan importarlo (esta módulo es 'use client' y sus exports no pueden
// ejecutarse desde el servidor).
export { parsePeriodParams } from './period-utils'
