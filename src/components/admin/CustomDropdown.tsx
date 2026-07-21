'use client'

/**
 * Dropdown custom estilable — reemplazo del <select> nativo.
 * Soporta single-select (default) y multi-select (con `multi` = true).
 *
 * En multi-select cada opción muestra un checkbox visual y el trigger
 * muestra "N seleccionados" cuando hay más de uno.
 */

import { useState, useRef, useEffect } from 'react'

export interface DropdownOption<T extends string = string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: DropdownOption<T>[]
  placeholder?: string
  /** Single: string. Multi: string[]. */
  value: T | T[]
  onChange: (v: T | T[]) => void
  multi?: boolean
  minWidth?: number | string
  className?: string
  style?: React.CSSProperties
}

export default function CustomDropdown<T extends string>({
  options,
  placeholder = 'Seleccionar',
  value,
  onChange,
  multi = false,
  minWidth = 180,
  className,
  style,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al click afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  const selectedValues: T[] = multi ? (value as T[]) : value ? [value as T] : []

  function isSelected(v: T) {
    return selectedValues.includes(v)
  }

  function handleClick(v: T) {
    if (multi) {
      const arr = value as T[]
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
      onChange(next)
    } else {
      onChange(v)
      setOpen(false)
    }
  }

  const label = (() => {
    if (multi) {
      if (selectedValues.length === 0) return placeholder
      if (selectedValues.length === 1) {
        return options.find((o) => o.value === selectedValues[0])?.label ?? placeholder
      }
      return `${selectedValues.length} seleccionados`
    }
    return options.find((o) => o.value === value)?.label ?? placeholder
  })()

  return (
    <div
      ref={ref}
      className={`dd ${open ? 'open' : ''} ${className ?? ''}`}
      data-multi={multi ? '' : undefined}
      style={{ minWidth, ...style }}
    >
      <button
        type="button"
        className="dd-trigger"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <span className="dd-label">{label}</span>
      </button>
      {open && (
        <div className="dd-menu" onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={isSelected(o.value) ? 'selected' : ''}
              onClick={() => handleClick(o.value)}
            >
              {o.label} <span className="check">✓</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
