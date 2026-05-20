import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: {
    default: 'Nexo by Previnca — Portal de Afiliados',
    template: '%s | Nexo by Previnca',
  },
  description: 'Accedé a tus teleconsultas DOC24, urgencias 24/7, descuentos en farmacias y atención odontológica desde un solo lugar.',
  keywords: ['nexo', 'previnca', 'salud', 'teleconsulta', 'doc24', 'urgencias', 'farmacia', 'odontología', 'afiliados'],
  authors: [{ name: 'Previnca' }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Nexo by Previnca',
    title: 'Nexo by Previnca — Portal de Afiliados',
    description: 'Accedé a tus teleconsultas DOC24, urgencias 24/7, descuentos en farmacias y atención odontológica desde un solo lugar.',
  },
  twitter: {
    card: 'summary',
    title: 'Nexo by Previnca — Portal de Afiliados',
    description: 'Accedé a todos tus beneficios de salud desde un solo lugar.',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {/* Background image */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bg.png)' }}
        />
        {/* Orb 1 - Purple top right */}
        <div
          className="fixed -top-32 -right-32 w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] rounded-full opacity-25 blur-[100px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, var(--purple) 0%, transparent 70%)',
            animation: 'orb-pulse-1 10s ease-in-out infinite',
          }}
        />
        {/* Orb 2 - Pink left */}
        <div
          className="fixed top-1/3 -left-40 w-[350px] h-[350px] rounded-full opacity-20 blur-[100px] pointer-events-none z-0 hidden md:block"
          style={{
            background: 'radial-gradient(circle, var(--pink) 0%, transparent 70%)',
            animation: 'orb-pulse-2 12s ease-in-out 3s infinite',
          }}
        />
        {/* Orb 3 - Peach bottom */}
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, var(--peach) 0%, transparent 70%)',
            animation: 'orb-pulse-2 14s ease-in-out 5s infinite',
          }}
        />
        <div className="relative z-10 flex flex-col min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
