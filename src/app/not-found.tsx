import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute pointer-events-none" style={{ top: '-80px', left: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'var(--purple)', opacity: 0.06, filter: 'blur(130px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'var(--pink)', opacity: 0.05, filter: 'blur(110px)' }} />
      <div className="pointer-events-none fixed inset-0" style={{ opacity: 0.15, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")", mixBlendMode: 'overlay' }} />

      <div className="w-full max-w-sm relative z-10 text-center">
        <div className="mb-8">
          <Link href="/login">
            <Image src="/logo.png" alt="Nexo by Previnca" width={180} height={72} style={{ objectFit: 'contain', height: '72px', width: 'auto', margin: '0 auto' }} priority />
          </Link>
        </div>

        <p
          className="text-8xl font-normal mb-2 leading-none"
          style={{
            fontFamily: 'var(--font-dm-serif)',
            background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>

        <h1 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Esta página no existe
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-sans)' }}>
          La página que buscás no está disponible.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Ir al login
          </Link>
          <Link
            href="/registro"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}
          >
            ¿No tenés cuenta? Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}
