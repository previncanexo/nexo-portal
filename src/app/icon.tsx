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
          background: 'linear-gradient(135deg, #12053d 0%, #6535cc 65%, #c94fb5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: 'white', lineHeight: 1 }}>
          N
        </span>
      </div>
    ),
    { ...size }
  )
}
