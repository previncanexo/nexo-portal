/**
 * Cliente HTTP para la API REST custom de Salesforce (`/services/apexrest/previnca/v1`).
 *
 * Auth: OAuth 2.0 client_credentials sobre una External Client App propia del
 * canal digital (distinta a la del Core). El token se cachea en memoria del
 * proceso serverless — un cold start pide token nuevo, warm requests reusan.
 *
 * Env vars requeridas:
 *   SF_INSTANCE_URL      → https://previnca--uat.sandbox.my.salesforce.com
 *   SF_TOKEN_URL         → https://test.salesforce.com/services/oauth2/token
 *                          (o https://login.salesforce.com para prod)
 *   SF_CLIENT_ID         → consumer key de la External Client App
 *   SF_CLIENT_SECRET     → consumer secret
 */

interface CachedToken {
  accessToken: string
  instanceUrl: string
  expiresAt: number
}

let tokenCache: CachedToken | null = null

/** true si están todas las env vars necesarias — usado por los callers para
 *  hacer no-op silencioso cuando aún no se cargaron las credenciales. */
export function isSfConfigured(): boolean {
  return Boolean(
    process.env.SF_TOKEN_URL &&
    process.env.SF_CLIENT_ID &&
    process.env.SF_CLIENT_SECRET &&
    process.env.SF_INSTANCE_URL,
  )
}

function getConfig() {
  const tokenUrl = process.env.SF_TOKEN_URL
  const clientId = process.env.SF_CLIENT_ID
  const clientSecret = process.env.SF_CLIENT_SECRET
  const instanceUrl = process.env.SF_INSTANCE_URL
  if (!tokenUrl || !clientId || !clientSecret || !instanceUrl) {
    throw new Error('Salesforce env vars missing (SF_TOKEN_URL / SF_CLIENT_ID / SF_CLIENT_SECRET / SF_INSTANCE_URL)')
  }
  return { tokenUrl, clientId, clientSecret, instanceUrl }
}

/**
 * Devuelve un access token válido, refrescándolo si expiró (buffer de 60s).
 * OAuth client_credentials no da refresh_token — se pide uno nuevo cada vez.
 */
export async function getAccessToken(): Promise<{ accessToken: string; instanceUrl: string }> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return { accessToken: tokenCache.accessToken, instanceUrl: tokenCache.instanceUrl }
  }

  const { tokenUrl, clientId, clientSecret, instanceUrl: fallbackUrl } = getConfig()
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SF token request failed: ${res.status} ${text.slice(0, 200)}`)
  }

  const data = await res.json() as {
    access_token: string
    instance_url?: string
    expires_in?: number
    token_type?: string
  }

  // SF client_credentials no siempre devuelve expires_in — asumimos 30 min si falta.
  const expiresIn = data.expires_in ?? 1800
  tokenCache = {
    accessToken: data.access_token,
    // La instance_url del token es la fuente de verdad; SF_INSTANCE_URL es fallback.
    instanceUrl: data.instance_url ?? fallbackUrl,
    expiresAt: now + expiresIn * 1000,
  }
  return { accessToken: tokenCache.accessToken, instanceUrl: tokenCache.instanceUrl }
}

export interface SfCallResult<T> {
  ok: boolean
  status: number
  body: T | null
  rawBody: unknown
}

/**
 * POST a un endpoint del namespace `previnca/v1`. No reintenta: la política de
 * reintento es del caller (idempotente vía `messageId`). Ante 5xx / network err
 * el caller puede reencolar con el mismo `messageId` y SF devuelve el mismo ack.
 */
export async function sfPost<T>(path: string, body: unknown): Promise<SfCallResult<T>> {
  const { accessToken, instanceUrl } = await getAccessToken()
  const url = `${instanceUrl}/services/apexrest/previnca/v1${path}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  let rawBody: unknown = null
  const text = await res.text().catch(() => '')
  if (text) {
    try { rawBody = JSON.parse(text) } catch { rawBody = text }
  }

  // 401 con token vencido → invalidar cache; el caller decide si reintenta.
  if (res.status === 401) {
    tokenCache = null
  }

  return {
    ok: res.ok,
    status: res.status,
    body: res.ok ? (rawBody as T) : null,
    rawBody,
  }
}
