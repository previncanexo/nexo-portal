import Image from 'next/image'
import Link from 'next/link'

export const metadata = { title: 'Pago recibido · Nexo by Previnca' }

export default function RegistroExitoPage() {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-sm relative z-10">

        <div className="text-center mb-8">
          <Link href="/login" className="inline-block">
            <Image
              src="/logo.png"
              alt="Nexo by Previnca"
              width={120}
              height={48}
              style={{ objectFit: 'contain', height: '72px', width: 'auto' }}
              priority
            />
          </Link>
        </div>

        <div
          className="rounded-3xl p-6 sm:p-8 text-center"
          style={{
            background: 'rgba(134,96,239,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            ¡Pago recibido!
          </h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu suscripción fue procesada correctamente. En breve recibirás un email confirmando la activación de tu cuenta.
          </p>

          <div
            className="rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
              ¿Qué sigue?
            </p>
            {[
              'Revisá tu email — te enviamos tus credenciales de acceso',
              'Recibirás un segundo email cuando tu cuenta esté activada',
              'Con las credenciales podés ingresar al portal en cualquier momento',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-dm-sans)' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="block w-full py-3 rounded-full font-bold text-sm text-center transition-opacity hover:opacity-90"
            style={{ background: 'white', color: 'var(--purple)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Ir al portal
          </Link>
        </div>

      </div>
    </div>
  )
}
