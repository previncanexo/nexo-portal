/**
 * GET /api/analytics/affiliates
 * Dump completo de la tabla affiliates para consumo desde Power BI.
 * Requiere header `Authorization: Bearer <ANALYTICS_API_KEY>`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAnalyticsAuth } from '@/lib/analytics-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = requireAnalyticsAuth(req)
  if (authError) return authError

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: data?.length ?? 0, results: data ?? [] })
}
