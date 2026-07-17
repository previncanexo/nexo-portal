/**
 * Bearer token auth para los endpoints de análisis (Power BI / BI tools).
 *
 * Uso desde una route handler:
 *   const err = requireAnalyticsAuth(req)
 *   if (err) return err
 *
 * Configurar en Vercel: `ANALYTICS_API_KEY = <string secreto>`
 * Power BI manda: `Authorization: Bearer <ANALYTICS_API_KEY>`
 */
import { NextResponse } from 'next/server'

export function requireAnalyticsAuth(req: Request): NextResponse | null {
  const expected = process.env.ANALYTICS_API_KEY
  if (!expected) {
    return NextResponse.json(
      { error: 'ANALYTICS_API_KEY no configurado en el servidor' },
      { status: 500 }
    )
  }
  const header = req.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
