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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
