'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { quickApproveAffiliate } from './actions'

interface PendingAffiliate {
  id: string
  nombre: string
  apellido: string
  email: string
  created_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ApproveButton({ affiliateId }: { affiliateId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleApprove() {
    startTransition(async () => {
      const result = await quickApproveAffiliate(affiliateId)
      if (result.success) setDone(true)
    })
  }

  if (done) {
    return (
      <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: 'rgb(74,222,128)', border: '1px solid rgba(74,222,128,0.25)' }}>
        Activado
      </span>
    )
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isPending}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95 disabled:opacity-40"
      style={{
        background: 'rgba(74,222,128,0.12)',
        color: 'rgb(74,222,128)',
        border: '1px solid rgba(74,222,128,0.25)',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {isPending ? '...' : 'Activar'}
    </button>
  )
}

export default function PendingApprovalSection({
  affiliates,
  totalCount,
}: {
  affiliates: PendingAffiliate[]
  totalCount: number
}) {
  if (totalCount === 0) return null

  return (
    <div
      className="rounded-2xl p-5 mb-10"
      style={{
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'rgb(251,191,36)', color: '#000' }}
          >
            {totalCount}
          </div>
          <p className="text-base font-semibold" style={{ color: 'rgb(251,191,36)' }}>
            Pendientes de aprobación
          </p>
        </div>
        <Link
          href="/admin/afiliados?status=pending"
          className="text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'rgba(251,191,36,0.7)' }}
        >
          Ver todos →
        </Link>
      </div>

      <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
        {affiliates.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-3 gap-4 flex-wrap">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Link
                href={`/admin/afiliados/${a.id}`}
                className="text-sm font-semibold text-white hover:opacity-80 transition-opacity truncate"
              >
                {a.nombre} {a.apellido}
              </Link>
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {a.email} · {formatDate(a.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ApproveButton affiliateId={a.id} />
              <Link
                href={`/admin/afiliados/${a.id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Ver perfil
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
