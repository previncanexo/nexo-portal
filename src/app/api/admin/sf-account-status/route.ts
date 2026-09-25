/**
 * TEMPORAL — consulta el estado real de una Account en SF usando la API
 * estándar REST. Sirve para verificar si `accountStatus` sigue en
 * `InPreparation` o si Nespon corrió Payment-Confirmation-API y activó.
 *
 * Uso:
 *   GET /api/admin/sf-account-status?accountId=<sfId>
 *   Header: Authorization: Bearer <CRON_SECRET>
 *
 * BORRAR una vez terminada la fase de tests con Nespon.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/salesforce/client'

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
  const accountId = url.searchParams.get('accountId')
  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  const { accessToken, instanceUrl } = await getAccessToken()
  const sfUrl = `${instanceUrl}/services/data/v60.0/sobjects/Account/${accountId}`
  const res = await fetch(sfUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const text = await res.text()
  let body: unknown = text
  try { body = JSON.parse(text) } catch {}

  return NextResponse.json({ status: res.status, ok: res.ok, body })
}
