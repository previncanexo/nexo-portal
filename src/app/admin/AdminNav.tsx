'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminNav() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'rgba(13,5,32,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Nexo by Previnca"
            width={100}
            height={48}
            style={{ objectFit: 'contain', height: '40px', width: 'auto' }}
            priority
          />
          <span
            className="text-sm font-semibold hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Admin · Previnca
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold px-4 py-2 rounded-full transition-all hover:bg-white/10 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Salir
        </button>
      </div>
    </header>
  )
}
