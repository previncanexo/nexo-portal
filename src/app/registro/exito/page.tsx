import Image from 'next/image'
import Link from 'next/link'

export const metadata = { title: 'Resultado del pago · Previnca Nexo' }

const WHATSAPP_URL = 'https://wa.me/5493415056130'

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-dark min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
              alt="Previnca Nexo"
              width={220}
              height={88}
              style={{ objectFit: 'contain', height: '88px', width: 'auto' }}
              priority
            />
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}

function IconCircle({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <div
      className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
      style={{ background: gradient, boxShadow: '0 8px 24px rgba(134,96,239,0.35)' }}
    >
      {children}
    </div>
  )
}

function ContactLinks() {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/registro"
        className="block w-full py-3 rounded-full font-bold text-sm text-center text-white transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(to right, var(--purple), var(--pink))',
          fontFamily: 'var(--font-dm-sans)',
          boxShadow: '0 8px 24px rgba(134,96,239,0.30)',
        }}
      >
        Volver a intentar
      </Link>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 rounded-full font-bold text-sm text-center transition-all hover:opacity-90"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.20)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        Contactar por WhatsApp
      </a>
    </div>
  )
}

function ApprovedState() {
  return (
    <div className="glass-card p-7 sm:p-8 text-center">
      <IconCircle gradient="linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </IconCircle>

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
  )
}

function PendingState() {
  return (
    <div className="glass-card p-7 sm:p-8 text-center">
      <IconCircle gradient="linear-gradient(135deg, #ca8a04 0%, #f59e0b 100%)">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </IconCircle>

      <h1
        className="text-2xl text-white mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
      >
        Pago en proceso
      </h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
        Tu pago está siendo procesado. Te avisaremos por email cuando se confirme y tu cuenta esté activa.
      </p>

      <div
        className="rounded-2xl p-4 mb-6 text-left"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)' }}>
          Próximos pasos
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
          Una vez que Mercado Pago confirme el pago, recibirás un email con tus credenciales de acceso. Esto puede demorar unos minutos.
        </p>
      </div>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 rounded-full font-bold text-sm text-center text-white transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(to right, var(--purple), var(--pink))',
          fontFamily: 'var(--font-dm-sans)',
          boxShadow: '0 8px 24px rgba(134,96,239,0.30)',
        }}
      >
        Contactar por WhatsApp
      </a>
    </div>
  )
}

function FailedState() {
  return (
    <div className="glass-card p-7 sm:p-8 text-center">
      <IconCircle gradient="linear-gradient(135deg, #dc2626 0%, #f87171 100%)">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </IconCircle>

      <h1
        className="text-2xl text-white mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
      >
        No se pudo confirmar el pago
      </h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.70)', fontFamily: 'var(--font-dm-sans)' }}>
        No pudimos confirmar tu pago. Podés intentarlo de nuevo o contactarnos para que te ayudemos.
      </p>

      <ContactLinks />
    </div>
  )
}

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ collection_status?: string; status?: string }>
}) {
  const params = await searchParams

  const isApproved =
    params.collection_status === 'approved' ||
    params.status === 'approved'

  const isPending =
    params.collection_status === 'pending' ||
    params.status === 'pending' ||
    params.collection_status === 'in_process'

  return (
    <PageShell>
      {isApproved ? (
        <ApprovedState />
      ) : isPending ? (
        <PendingState />
      ) : (
        <FailedState />
      )}
    </PageShell>
  )
}
