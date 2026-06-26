/**
 * GA4 Measurement Protocol helper (server-side events).
 *
 * Para que GA4 atribuya el evento al mismo usuario que llegó al sitio,
 * necesitamos el `client_id` capturado del cookie `_ga` en el browser
 * y forwardeado al backend cuando se creó el affiliate.
 *
 * Configurar en Vercel:
 *  - GA4_MEASUREMENT_ID = G-7FEV504KNB
 *  - GA4_API_SECRET     = generado en GA4 → Admin → Data streams → Measurement Protocol API secrets
 */

export interface Ga4Event {
  name: string
  params: Record<string, unknown>
}

export interface SendGa4Args {
  /** Del cookie `_ga` del browser. Formato típico: `GA1.1.<rand>.<ts>` → usar `<rand>.<ts>` */
  clientId?: string | null
  events: Ga4Event[]
  /** Opcional: user_id propio (ej. affiliate.id) — ayuda a unir sesiones cross-device */
  userId?: string | null
}

/**
 * POST a https://www.google-analytics.com/mp/collect. Fire-and-forget.
 * No-op si faltan envs (no rompe el caller).
 */
export async function sendGa4Events({ clientId, events, userId }: SendGa4Args): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID
  const apiSecret = process.env.GA4_API_SECRET
  if (!measurementId || !apiSecret) {
    console.warn('[ga4-mp] GA4_MEASUREMENT_ID o GA4_API_SECRET no configurados — eventos descartados')
    return
  }
  if (!clientId) {
    console.warn('[ga4-mp] sin client_id — evento descartado (no se podría atribuir la sesión)')
    return
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

  const body = {
    client_id: clientId,
    ...(userId ? { user_id: userId } : {}),
    events,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[ga4-mp] error', res.status, txt.slice(0, 500))
    }
  } catch (err) {
    console.error('[ga4-mp] network error', err)
  }
}

/**
 * Extrae el client_id del cookie `_ga`.
 * Formato: `GA1.1.1234567890.1700000000` → devuelve `1234567890.1700000000`.
 */
export function parseGaClientId(rawGaCookie: string | null | undefined): string | undefined {
  if (!rawGaCookie) return undefined
  const parts = rawGaCookie.split('.')
  if (parts.length < 4) return undefined
  return parts.slice(-2).join('.')
}
