'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#f87171' }}>
        Error en el panel
      </h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
        {error.digest ? `Código: ${error.digest}` : 'Error inesperado'}
      </p>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', maxWidth: '400px' }}>
        Ocurrió un error al cargar esta sección. Podés intentar recargar.
      </p>
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
        Recargar
      </button>
    </div>
  )
}
