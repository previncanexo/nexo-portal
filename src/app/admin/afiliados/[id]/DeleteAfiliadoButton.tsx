'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { deleteAffiliate } from './actions'

export default function DeleteAfiliadoButton({ affiliateId, nombre }: { affiliateId: string; nombre: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAffiliate(affiliateId)
      if (result && !result.success) {
        setError(result.message)
      } else {
        router.push('/admin/afiliados')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.30)', color: '#f87171' }}
      >
        Eliminar afiliado
      </button>

      {open && createPortal(
        <div
          className="portal-dark fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#1a1025', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-white">¿Eliminar afiliado?</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Vas a eliminar a <strong className="text-white">{nombre}</strong> permanentemente. Esta acción cancela su suscripción en Mercado Pago y no se puede deshacer.
              </p>
            </div>

            {error && (
              <p className="text-xs font-medium px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.12)', color: '#f87171' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: 'rgba(220,38,38,0.85)', color: 'white' }}
              >
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
