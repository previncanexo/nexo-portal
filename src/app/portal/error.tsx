'use client'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0118',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
        Algo salió mal
      </h1>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', maxWidth: '400px' }}>
        Ocurrió un error inesperado. Por favor intentá de nuevo o contactanos por WhatsApp si el problema persiste.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            background: 'rgba(134,96,239,0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
        <a
          href="https://wa.me/5493415056130"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Contactar soporte
        </a>
      </div>
    </div>
  )
}
