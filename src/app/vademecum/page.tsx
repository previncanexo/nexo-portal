'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

interface Med {
  n: string
  p: string
  l: string
  c: string
  m: string
}

const PAGE_SIZE = 50

export default function VademecumPage() {
  const [meds, setMeds] = useState<Med[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/vademecum.json')
      .then((r) => r.json())
      .then((data) => { setMeds(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return meds
    const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return meds.filter(
      (m) =>
        normalize(m.n).includes(q) ||
        normalize(m.m).includes(q) ||
        normalize(m.c).includes(q) ||
        normalize(m.l).includes(q)
    )
  }, [query, meds])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const results = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isFiltering = query.trim().length > 0

  // Reset to page 1 when query changes
  useEffect(() => { setPage(1) }, [query])

  const goTo = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build page range for pagination buttons
  const pageRange = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const range: (number | '...')[] = [1]
    if (page > 3) range.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) range.push(i)
    if (page < totalPages - 2) range.push('...')
    range.push(totalPages)
    return range
  }, [page, totalPages])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #12053d 0%, #1e0a5a 40%, #2d1266 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 border-b" style={{ background: 'rgba(18,5,61,0.90)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-4">
          <a href="/" className="flex-shrink-0">
            <Image src="/logo.png" alt="Previnca Nexo" width={120} height={40} sizes="120px" style={{ objectFit: 'contain', height: '36px', width: 'auto' }} />
          </a>
          <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-sm font-semibold text-white/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>Vademécum de cobertura</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white mb-5"
            style={{ background: 'linear-gradient(to right, #8660EF, #E879A0)' }}
          >
            Previnca Nexo · 50% de descuento
          </div>
          <h1
            className="text-white mb-3 leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 52px)' }}
          >
            Medicamentos con cobertura
          </h1>
          <p className="text-white/55 text-base max-w-lg mx-auto" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Todos los medicamentos del listado tienen 50% de descuento en farmacias adheridas con tu credencial Nexo.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscá por nombre, molécula, laboratorio o categoría..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              fontFamily: 'var(--font-dm-sans)',
            }}
            onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(134,96,239,0.60)' }}
            onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.14)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Count */}
        <div className="mb-4 text-xs text-white/40 px-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {loading
            ? 'Cargando...'
            : isFiltering
              ? `${filtered.length.toLocaleString('es-AR')} resultado${filtered.length !== 1 ? 's' : ''} para "${query}"`
              : `${meds.length.toLocaleString('es-AR')} medicamentos en total`
          }
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Table header */}
              <div
                className="grid text-xs font-bold uppercase tracking-wider text-white/40 px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr', fontFamily: 'var(--font-dm-sans)' }}
              >
                <span>Nombre</span>
                <span>Presentación</span>
                <span>Laboratorio</span>
                <span>Molécula</span>
              </div>

              {results.length === 0 ? (
                <div className="py-16 text-center text-white/40 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  No se encontraron resultados para <strong className="text-white/60">"{query}"</strong>
                </div>
              ) : (
                results.map((med, i) => (
                  <div
                    key={i}
                    className="grid px-5 py-3.5 text-sm transition-colors hover:bg-white/[0.03]"
                    style={{
                      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    <span className="font-semibold text-white truncate pr-3">{med.n}</span>
                    <span className="text-white/60 truncate pr-3">{med.p}</span>
                    <span className="text-white/50 truncate pr-3">{med.l}</span>
                    <span className="text-white/50 truncate">{med.m}</span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>

                {pageRange.map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-white/30 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goTo(p as number)}
                      className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: page === p ? 'linear-gradient(to right, #8660EF, #E879A0)' : 'transparent',
                        border: page === p ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        color: page === p ? 'white' : 'rgba(255,255,255,0.55)',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-xs text-white/30 mt-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Página {page} de {totalPages}
              </p>
            )}
          </>
        )}

        <p className="text-center text-xs text-white/30 mt-8" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Listado sujeto a disponibilidad en farmacias adheridas. El descuento aplica únicamente con credencial Nexo activa.
        </p>
      </div>
    </div>
  )
}
