'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/afiliados', label: 'Afiliados' },
]

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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

        <div className="flex items-center gap-2">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menú"
            className="sm:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl transition-all"
            style={{
              background: mobileOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              gap: '4px',
            }}
          >
            <span
              className="block w-4 h-0.5 rounded-full transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-4 h-0.5 rounded-full transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-4 h-0.5 rounded-full transition-all"
              style={{
                background: 'rgba(255,255,255,0.8)',
                transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
              }}
            />
          </button>

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
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          className="sm:hidden mt-3 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(13,5,32,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-5 py-3.5 text-sm font-semibold transition-colors"
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
