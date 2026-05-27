import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #8660EF 0%, #E879A0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '22px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
          N
        </span>
      </div>
    ),
    { ...size }
  )
}
