'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/afiliados', label: 'Afiliados' },
]

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4"
      style={{
        background: 'rgba(13,5,32,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Nexo by Previnca"
            width={100}
            height={48}
            style={{ objectFit: 'contain', height: '38px', width: 'auto' }}
            priority
          />
          <span
            className="text-sm font-semibold hidden sm:block px-2.5 py-1 rounded-lg"
            style={{
              color: 'rgba(255,255,255,0.75)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-dm-sans)',
              letterSpacing: '0.02em',
            }}
          >
            Admin
          </span>

          <nav className="hidden sm:flex items-center gap-1" aria-label="Navegación admin">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                    background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.12)'
                      : '1px solid transparent',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm font-semibold px-4 py-2 min-h-[36px] rounded-full transition-all hover:bg-white/10 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
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
