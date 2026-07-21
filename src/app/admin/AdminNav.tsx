'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/afiliados', label: 'Afiliados' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/pagos', label: 'Pagos' },
  { href: '/admin/seguro-hogar', label: 'Seguro de Hogar' },
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
    <div
      className="fixed top-3 z-50 pointer-events-none"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '1280px',
        padding: '0 16px',
      }}
    >
      <div className="pointer-events-auto w-full flex flex-col">
        {/* Pill nav — grid 3 columnas: brand | links centrados | logout */}
        <nav
          className="w-full items-center"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: '56px',
            background: 'rgba(18,5,61,0.85)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '9999px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.24)',
            padding: '8px 12px 8px 28px',
          }}
        >
          {/* Left: logo + badge */}
          <div className="flex items-center gap-3" style={{ justifySelf: 'start' }}>
            <Image
              src="/logo.png"
              alt="Previnca Nexo"
              width={100}
              height={32}
              sizes="100px"
              style={{ objectFit: 'contain', height: '32px', width: 'auto', transform: 'translateY(-3px)' }}
              priority
            />
            <span
              className="text-xs font-bold hidden sm:block px-2.5 py-1 rounded-lg uppercase tracking-wide"
              style={{
                color: 'rgba(255,255,255,0.70)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Admin
            </span>
          </div>

          {/* Center: nav links */}
          <nav
            className="hidden sm:flex items-center gap-1"
            style={{ justifySelf: 'center' }}
            aria-label="Navegación admin"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium px-3.5 py-2 rounded-full transition-all"
                  style={{
                    fontFamily: 'var(--font-dm-sans)',
                    color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.60)',
                    background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right: hamburger (mobile) + logout */}
          <div className="flex items-center gap-2" style={{ justifySelf: 'end' }}>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menú"
              className="sm:hidden flex flex-col justify-center items-center w-9 h-9 rounded-full transition-all"
              style={{
                background: mobileOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                cursor: 'pointer',
                gap: '4px',
              }}
            >
              <span
                className="block w-4 h-0.5 rounded-full transition-all"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
                }}
              />
              <span
                className="block w-4 h-0.5 rounded-full transition-all"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-4 h-0.5 rounded-full transition-all"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
                }}
              />
            </button>

            <button
              onClick={handleLogout}
              className="text-sm font-semibold px-4 py-2.5 min-h-[40px] rounded-full transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              }}
            >
              Salir
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="sm:hidden mt-2 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(18,5,61,0.97)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.30)',
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
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
