'use client'

/**
 * Chart card con toggle Barras/Línea.
 * - Barras: filas horizontales con gradiente purple/pink.
 * - Línea: SVG line chart con área degradada.
 *
 * Usado en el Dashboard para los 4 charts (Nuevos afiliados, Ingresos,
 * Caídas, Leads). Cada instancia recibe sus datos ya agregados.
 */

import { useState } from 'react'

interface Point {
  label: string
  value: number
}

interface Props {
  caption: string
  data: Point[]
  format?: 'int' | 'money'
}

function fmt(v: number, format: 'int' | 'money'): string {
  if (format === 'money') return '$' + v.toLocaleString('es-AR')
  return String(v)
}

function renderBars(data: Point[], format: 'int' | 'money') {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      {data.map((d) => {
        const pct = (d.value / max) * 100
        return (
          <div key={d.label} className="bar-row">
            <span className="bar-label">{d.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bar-value">{fmt(d.value, format)}</span>
          </div>
        )
      })}
    </div>
  )
}

function renderLine(data: Point[], format: 'int' | 'money') {
  const W = 560, H = 220, PL = 44, PR = 12, PT = 20, PB = 32
  const iw = W - PL - PR
  const ih = H - PT - PB
  const max = Math.max(...data.map((d) => d.value), 1)
  const stepX = data.length > 1 ? iw / (data.length - 1) : iw

  const pts = data.map((d, i) => {
    const x = PL + i * stepX
    const y = PT + ih - (d.value / max) * ih
    return { x, y, ...d }
  })

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PT + ih} L ${pts[0].x} ${PT + ih} Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const y = PT + ih * t
    const val = max * (1 - t)
    return (
      <g key={t}>
        <line className="grid-line" x1={PL} y1={y} x2={W - PR} y2={y} />
        <text className="axis-label" x={PL - 8} y={y + 3} textAnchor="end">
          {fmt(Math.round(val), format)}
        </text>
      </g>
    )
  })

  return (
    <svg className="line-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8660ef" />
          <stop offset="100%" stopColor="#ee5cd0" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8660ef" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8660ef" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines}
      <path className="line-area" d={areaD} />
      <path className="line-stroke" d={pathD} />
      {pts.map((p) => (
        <circle key={p.label} className="line-dot" cx={p.x} cy={p.y} r={4} />
      ))}
      {pts.map((p) => (
        <text key={`x-${p.label}`} className="axis-label" x={p.x} y={H - 10} textAnchor="middle">
          {p.label.split(' ')[0]}
        </text>
      ))}
    </svg>
  )
}

export default function BarLineChart({ caption, data, format = 'int' }: Props) {
  const [mode, setMode] = useState<'bars' | 'line'>('bars')

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <p className="chart-caption">{caption}</p>
        </div>
        <div className="chart-toggle">
          <button
            type="button"
            className={mode === 'bars' ? 'active' : ''}
            onClick={() => setMode('bars')}
            title="Barras"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            Barras
          </button>
          <button
            type="button"
            className={mode === 'line' ? 'active' : ''}
            onClick={() => setMode('line')}
            title="Línea"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 17 9 11 13 15 21 7" />
            </svg>
            Línea
          </button>
        </div>
      </div>
      <div className="chart-body">
        {mode === 'bars' ? renderBars(data, format) : renderLine(data, format)}
      </div>
    </div>
  )
}
