/**
 * Meta Conversions API helper.
 *
 * Cada evento se dispara DOS veces:
 *  - Client-side: pixel con `fbq('track', name, params, { eventID })`
 *  - Server-side: POST a graph.facebook.com con el mismo `event_id`
 *
 * Meta deduplica por (event_name + event_id) dentro de una ventana de 48hs.
 * Esto mejora la cobertura cuando el pixel está bloqueado por ad blockers.
 *
 * Configurar en Vercel:
 *  - META_PIXEL_ID   = 2187028668714954
 *  - META_CAPI_ACCESS_TOKEN = generado en Events Manager → Settings → CAPI
 */

import crypto from 'crypto'

const META_API_VERSION = 'v19.0'

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex')
}

/** Normaliza y hashea un teléfono (solo dígitos, con código de país) */
function hashPhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return undefined
  // Si no tiene país (asume Argentina) le antepone 54
  const withCountry = digits.startsWith('54') ? digits : '54' + digits.replace(/^0/, '')
  return sha256(withCountry)
}

/** Normaliza y hashea un DNI / external_id */
function hashId(id: string | null | undefined): string | undefined {
  if (!id) return undefined
  return sha256(id.replace(/\D/g, ''))
}

function hashEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined
  return sha256(email)
}

function hashName(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  return sha256(name)
}

export interface MetaUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  dni?: string
  ciudad?: string
  countryCode?: string  // por default 'ar'
  externalId?: string   // ej: affiliate.id
  /** Cookie _fbp del browser (capturada del request) */
  fbp?: string
  /** Cookie _fbc del browser (capturada del request) */
  fbc?: string
  /** IP del cliente (request.headers x-forwarded-for) */
  clientIp?: string
  /** User-Agent del cliente (request.headers user-agent) */
  clientUserAgent?: string
}

interface MetaCustomData {
  currency?: string
  value?: number
  content_name?: string
  content_category?: string
  content_ids?: string[]
}

export interface MetaCapiEvent {
  /** Standard event name: Lead | CompleteRegistration | InitiateCheckout | etc. */
  event_name: string
  /** ID compartido con el pixel para dedup */
  event_id: string
  /** URL donde ocurrió el evento (mejora atribución) */
  event_source_url?: string
  user_data: MetaUserData
  custom_data?: MetaCustomData
}

/**
 * Envía uno o más eventos a la Conversions API de Meta.
 * Fire-and-forget: nunca tira excepción al caller, solo loguea.
 */
export async function sendMetaCapiEvents(events: MetaCapiEvent[]): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken) {
    console.warn('[meta-capi] META_PIXEL_ID o META_CAPI_ACCESS_TOKEN no configurados — eventos descartados')
    return
  }

  const eventTime = Math.floor(Date.now() / 1000)

  const data = events.map((e) => ({
    event_name: e.event_name,
    event_time: eventTime,
    event_id: e.event_id,
    event_source_url: e.event_source_url,
    action_source: 'website',
    user_data: {
      em: e.user_data.email ? [hashEmail(e.user_data.email)] : undefined,
      ph: e.user_data.phone ? [hashPhone(e.user_data.phone)] : undefined,
      fn: hashName(e.user_data.firstName),
      ln: hashName(e.user_data.lastName),
      ct: hashName(e.user_data.ciudad),
      country: hashName(e.user_data.countryCode ?? 'ar'),
      external_id: hashId(e.user_data.externalId ?? e.user_data.dni),
      fbp: e.user_data.fbp,
      fbc: e.user_data.fbc,
      client_ip_address: e.user_data.clientIp,
      client_user_agent: e.user_data.clientUserAgent,
    },
    custom_data: e.custom_data,
  }))

  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[meta-capi] error', res.status, body.slice(0, 500))
    }
  } catch (err) {
    console.error('[meta-capi] network error', err)
  }
}

/** Extrae fbp y fbc de las cookies del Request */
export function extractFbCookies(req: Request): { fbp?: string; fbc?: string } {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return {}
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  return { fbp: cookies['_fbp'], fbc: cookies['_fbc'] }
}

/** Devuelve la IP del cliente desde los headers (compatible con Vercel) */
export function extractClientIp(req: Request): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  )
}
