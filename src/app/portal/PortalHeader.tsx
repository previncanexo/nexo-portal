'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Affiliate } from '@/lib/types'

interface PortalHeaderProps {
  affiliate: Affiliate | null
}

export default function PortalHeader({ affiliate }: PortalHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = affiliate
    ? `${affiliate.nombre} ${affiliate.apellido}`
    : 'Mi cuenta'

  return (
    <header
      className="relative z-10 px-4 py-4"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Logo */}
        <span
          className="text-2xl font-normal"
          style={{
            fontFamily: 'var(--font-dm-serif)',
            background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          nexo
        </span>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium hidden sm:block truncate max-w-[180px]"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            {displayName}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
