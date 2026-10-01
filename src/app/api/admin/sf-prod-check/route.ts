/**
 * TEMPORAL — verifica si la URL candidata de SF PRODUCCIÓN responde,
 * autenticándose con `login.salesforce.com` (prod OAuth) y disparando un
 * /leads con datos ficticios.
 *
 * No consume env vars nuevas: reusa SF_CLIENT_ID + SF_CLIENT_SECRET
 * asumiendo que la External Client App es la misma que UAT.
 *
 * Params:
 *   instanceUrl (opcional) — default: https://previncasa.my.salesforce.com
 *   tokenUrl    (opcional) — default: https://login.salesforce.com/services/oauth2/token
 *   dni / email (opcionales) — ficticios por default
 *
 * BORRAR después de la verificación.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const instanceUrl = url.searchParams.get('instanceUrl') ?? 'https://previncasa.my.salesforce.com'
  const tokenUrl = url.searchParams.get('tokenUrl') ?? 'https://login.salesforce.com/services/oauth2/token'
  const dni = url.searchParams.get('dni') ?? String(Math.floor(10000000 + Math.random() * 89999999))
  const suffix = Math.random().toString(36).slice(2, 8)
  const email = url.searchParams.get('email') ?? `prod.check.${suffix}@yopmail.com`

  const clientId = process.env.SF_CLIENT_ID
  const clientSecret = process.env.SF_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'SF_CLIENT_ID / SF_CLIENT_SECRET not set' }, { status: 500 })
  }

  // Paso 1: OAuth client_credentials contra login.salesforce.com (prod)
  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  })
  const tokenText = await tokenRes.text()
  let tokenJson: unknown = null
  try { tokenJson = JSON.parse(tokenText) } catch {}

  if (!tokenRes.ok) {
    return NextResponse.json({
      step: 'oauth',
      ok: false,
      status: tokenRes.status,
      tokenUrl,
      response: tokenJson ?? tokenText.slice(0, 300),
    })
  }

  const token = (tokenJson as { access_token?: string; instance_url?: string } | null)
  const accessToken = token?.access_token
  const resolvedInstanceUrl = token?.instance_url ?? instanceUrl

  if (!accessToken) {
    return NextResponse.json({
      step: 'oauth',
      ok: false,
      note: 'no access_token in response',
      response: tokenJson,
    })
  }

  // Paso 2: dispara /leads contra la instance resuelta
  const leadBody = {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    firstName: 'ProdCheck',
    lastName: `Test${suffix}`,
    documentType: 'DNI',
    documentNumber: dni,
    email,
    mobilePhone: '3415555555',
    birthdate: '1990-01-15',
    salesChannel: 'Nexo',
    declaredMembersCount: 1,
    seniorMembersCount: 0,
    address: {
      country: 'Argentina',
      state: 'Santa Fe',
      street: 'Calle Falsa 123',
      city: 'Rosario',
      postalCode: '2000',
    },
  }

  const leadsUrl = `${resolvedInstanceUrl}/services/apexrest/previnca/v1/leads`
  const leadRes = await fetch(leadsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(leadBody),
  })
  const leadText = await leadRes.text()
  let leadResponse: unknown = leadText
  try { leadResponse = JSON.parse(leadText) } catch {}

  return NextResponse.json({
    step: 'leads',
    oauth: {
      tokenUrl,
      resolvedInstanceUrl,
      tokenPrefix: accessToken.slice(0, 20) + '...',
    },
    leads: {
      url: leadsUrl,
      status: leadRes.status,
      ok: leadRes.ok,
      response: leadResponse,
    },
    sentPayload: leadBody,
  })
}
