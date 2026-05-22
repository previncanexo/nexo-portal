import Image from 'next/image'
import Link from 'next/link'

export const metadata = { title: 'Pago recibido · Nexo by Previnca' }

export default function RegistroExitoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Orb purple */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px',
          left: '-120px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'var(--purple)',
          opacity: 0.06,
          filter: 'blur(130px)',
        }}
      />
      {/* Orb pink */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-100px',
          right: '-100px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'var(--pink)',
          opacity: 0.05,
          filter: 'blur(110px)',
        }}
      />
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.15,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          mixBlendMode: 'overlay',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-block">
            <Image
              src="/logo.png"
              alt="Nexo by Previnca"
              width={220}
              height={88}
              style={{ objectFit: 'contain', height: '88px', width: 'auto' }}
              priority
            />
          </Link>
        </div>

        <div className="glass-card p-7 sm:p-8 text-center">
          {/* Check icon */}
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)', boxShadow: '0 8px 24px rgba(134,96,239,0.35)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            className="text-2xl text-white mb-2"
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
          >
            ¡Pago recibido!
          </h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu suscripción fue procesada correctamente. En breve recibirás un email confirmando la activación de tu cuenta.
          </p>

          <div
            className="rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
              ¿Qué sigue?
            </p>
            {[
              'Revisá tu email — te enviamos tus credenciales de acceso',
              'Recibirás un segundo email cuando tu cuenta esté activada',
              'Con las credenciales podés ingresar al portal en cualquier momento',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="block w-full py-3 rounded-full font-bold text-sm text-center text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(to right, var(--purple), var(--pink))',
              fontFamily: 'var(--font-dm-sans)',
              boxShadow: '0 8px 24px rgba(134,96,239,0.30)',
            }}
          >
            Ir al portal
          </Link>
        </div>
      </div>
    </div>
  )
}
