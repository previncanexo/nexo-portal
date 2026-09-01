'use client'

import LogoNexo from '../components/LogoNexo'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Affiliate } from '@/lib/types'

interface PortalHeaderProps {
  affiliate: Affiliate | null
}

function IconPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export default function PortalHeader({ affiliate }: PortalHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = affiliate ? `${affiliate.nombre} ${affiliate.apellido}` : 'Mi cuenta'

  return (
    /* Floating pill nav wrapper */
    /* La misma envoltura que el <main> del layout (max-w-[680px] + px-4/sm:px-6)
       para que la barra quede EXACTAMENTE del ancho de las tarjetas. Antes el
       nav media 680 y las tarjetas 632, y la barra sobresalia 24px por lado. */
    <div className="fixed top-3 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6">
      <nav
        /*
          max-w-[680px]: el mismo ancho que la columna de contenido (ver el
          <main> del layout). Antes era 960px y la barra sobresalia de las cards,
          que era justo lo que se veia desprolijo.

          Sin backdrop-filter: es un elemento `fixed`, o sea de lo mas caro que
          se le puede pedir a un telefono, y sobre fondo claro no aporta nada.
          La sombra pasa a la del sistema: antes era 0.24 de negro y pesaba mas
          que las propias tarjetas.
        */
        className="pointer-events-auto w-full flex items-center justify-between"
        style={{
          background: 'var(--superficie-card)',
          border: '1px solid var(--borde)',
          borderRadius: '9999px',
          boxShadow: 'var(--sombra-card)',
          padding: '6px 8px 6px 18px',
        }}
      >
        {/* Logo */}
        <LogoNexo alto={34} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/portal/cuenta"
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full transition-all hover:bg-white/10"
            style={{ color: 'var(--texto)', fontFamily: 'var(--font-dm-sans)' }}
          >
            <IconPerson />
            <span className="hidden sm:inline truncate max-w-[160px]">{displayName}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold px-4 py-2.5 min-h-[40px] rounded-full transition-all active:scale-95"
            style={{
              background: 'var(--superficie-sutil)',
              border: '1px solid var(--borde-fuerte)',
              color: 'var(--texto)',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--borde-fuerte)'
              e.currentTarget.style.borderColor = 'var(--texto-tenue)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--superficie-sutil)'
              e.currentTarget.style.borderColor = 'var(--borde-fuerte)'
            }}
          >
            Salir
          </button>
        </div>
        </nav>
      </div>
    </div>
  )
}
