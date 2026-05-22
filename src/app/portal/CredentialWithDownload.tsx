'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import CredentialCard from './CredentialCard'
import type { Affiliate } from '@/lib/types'

export default function CredentialWithDownload({ affiliate }: { affiliate: Affiliate }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = `credencial-${affiliate.affiliate_number}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={cardRef} style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <CredentialCard affiliate={affiliate} />
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.20)',
          color: 'rgba(255,255,255,0.85)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {loading ? (
          'Generando...'
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar credencial
          </>
        )}
      </button>
    </div>
  )
}
