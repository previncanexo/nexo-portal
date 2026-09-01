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
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className="pointer-events-auto w-full max-w-[960px] flex items-center justify-between"
        style={{
          background: 'var(--superficie-card)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          border: '1px solid var(--borde-fuerte)',
          borderRadius: '9999px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.24)',
          padding: '6px 8px 6px 20px',
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
  )
}
