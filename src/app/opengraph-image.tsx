import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Previnca Nexo — Portal de Afiliados'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #12053d 0%, #2d1266 35%, #6535cc 70%, #c94fb5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '440px', height: '440px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,79,181,0.28) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-60px',
          width: '360px', height: '360px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(101,53,204,0.30) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(238,92,208,0.20) 0%, transparent 70%)',
        }} />

        {/* Decorative ellipse arc */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '1200px', height: '630px' }}
          viewBox="0 0 1200 630"
        >
          <ellipse cx="950" cy="315" rx="480" ry="340" stroke="rgba(255,255,255,0.05)" strokeWidth="70" fill="none" />
        </svg>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '72px 80px', flex: 1, position: 'relative' }}>

          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '44px', fontStyle: 'italic', color: 'white' }}>N</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'italic', color: 'white', opacity: 0.94 }}>
                Nexo
              </span>
              <span style={{ fontFamily: 'sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '3px' }}>
                BY PREVINCA
              </span>
            </div>
          </div>

          <div style={{ width: '240px', height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '32px' }} />

          {/* Headline */}
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '76px',
            fontStyle: 'italic',
            color: 'white',
            lineHeight: 1.08,
            letterSpacing: '-2px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span>Portal de Afiliados</span>
            <span style={{ fontSize: '42px', opacity: 0.68, marginTop: '8px', letterSpacing: '-1px' }}>Previnca Nexo</span>
          </div>

          {/* Description */}
          <div style={{
            fontFamily: 'sans-serif',
            fontSize: '21px',
            color: 'rgba(255,255,255,0.60)',
            letterSpacing: '0.2px',
            marginBottom: '32px',
          }}>
            Teleconsultas · Urgencias 24/7 · Farmacias · Odontología
          </div>

          {/* Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: '32px',
            padding: '10px 24px',
            width: 'fit-content',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4ade80',
            }} />
            <span style={{ fontFamily: 'sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
              Todos tus beneficios desde un solo lugar
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
