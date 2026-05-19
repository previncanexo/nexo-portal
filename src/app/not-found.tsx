import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--purple)' }}
      />
      <div
        className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--pink)' }}
      />

      <div className="w-full max-w-sm relative z-10 text-center">
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

        <h1
          className="text-xl font-semibold text-white mb-2"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Esta página no existe
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          La página que buscás no está disponible.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/portal"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-opacity hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--pink) 100%)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Volver al inicio
          </Link>
          <Link
            href="/login"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
