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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconSalir() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

/**
 * Botón circular del header. Es el patrón de las referencias: acciones sueltas
 * flotando sobre el fondo, sin barra que las contenga.
 *
 * 44px es el mínimo táctil que pide AGENTS.md; acá importa más que en otros
 * lados porque parte del público son adultos mayores.
 */
function BotonCircular({
  etiqueta,
  onClick,
  href,
  children,
}: {
  etiqueta: string
  onClick?: () => void
  href?: string
  children: React.ReactNode
}) {
  const estilo: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '9999px',
    background: 'var(--superficie-card)',
    border: '1px solid var(--borde)',
    boxShadow: 'var(--sombra-card)',
    color: 'var(--texto)',
    cursor: 'pointer',
  }
  const clases = 'flex items-center justify-center shrink-0 transition-transform active:scale-95'

  if (href) {
    return (
      <Link href={href} aria-label={etiqueta} title={etiqueta} className={clases} style={estilo}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta} className={clases} style={estilo}>
      {children}
    </button>
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

  const nombre = affiliate?.nombre ?? 'Mi cuenta'

  return (
    /*
      Ya NO es `fixed`: acompaña al contenido en vez de seguir al usuario. La
      barra flotante ocupaba espacio permanente en una pantalla que se navega
      scrolleando, y una vez adentro del portal el logo no necesita estar
      siempre visible.

      Tampoco hay contenedor: el logo y las acciones flotan sobre el fondo, que
      es el patrón de las referencias.
    */
    <header className="relative z-10 w-full max-w-[680px] mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
      <div className="flex items-center justify-between gap-4">
        <LogoNexo alto={30} centrado={false} />

        <div className="flex items-center gap-2.5">
          <BotonCircular etiqueta={`Mi cuenta · ${nombre}`} href="/portal/cuenta">
            <IconPerson />
          </BotonCircular>
          <BotonCircular etiqueta="Cerrar sesión" onClick={handleLogout}>
            <IconSalir />
          </BotonCircular>
        </div>
      </div>
    </header>
  )
}
