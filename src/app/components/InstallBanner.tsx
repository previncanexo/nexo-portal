'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('pwa-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setShow(false)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div
      className="fixed left-0 right-0 z-[200] px-4"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: 'rgba(18,5,61,0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* Ícono */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
        >
          <img src="/logo.png" alt="Nexo" className="w-10 h-10 object-contain" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Instalá Nexo
          </p>
          {isIOS ? (
            <p className="text-white/55 text-[11px] mt-0.5 leading-snug" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Tocá <span className="text-white/80 font-semibold">Compartir</span> y luego <span className="text-white/80 font-semibold">Agregar al inicio</span>
            </p>
          ) : (
            <p className="text-white/55 text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Accedé más rápido desde tu pantalla de inicio
            </p>
          )}
        </div>

        {/* Botón instalar (solo Android) */}
        {!isIOS && (
          <button
            onClick={install}
            className="px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              border: 'none',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Instalar
          </button>
        )}

        {/* Cerrar */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.10)', border: 'none' }}
          aria-label="Cerrar"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
