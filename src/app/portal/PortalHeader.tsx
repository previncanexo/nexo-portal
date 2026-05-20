'use client'

import Image from 'next/image'
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
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--purple) 85%, transparent) 0%, color-mix(in srgb, var(--pink) 85%, transparent) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <Image src="/logo.png" alt="Nexo by Previnca" width={100} height={40} style={{ objectFit: 'contain', height: '36px', width: 'auto' }} priority />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-white/80">
            <IconPerson />
            <span className="text-sm font-medium truncate max-w-[180px]">{displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-full transition-all hover:bg-white/20 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
