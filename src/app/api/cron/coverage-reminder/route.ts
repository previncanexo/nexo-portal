import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCoverageReminderEmail } from '@/lib/emails'

// Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
// Set CRON_SECRET as an env var in Vercel to protect this endpoint.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // allow in dev where no secret is set
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDateAR(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: string[] = []

  // Send reminders at 7 days and 1 day before expiry
  for (const daysLeft of [7, 1]) {
    const target = new Date()
    target.setDate(target.getDate() + daysLeft)
    const from = dateOnly(target)
    const to = dateOnly(new Date(target.getTime() + 24 * 60 * 60 * 1000))

    const { data: affiliates, error } = await supabase
      .from('affiliates')
      .select('nombre, email, cobertura_hasta')
      .eq('status', 'active')
      .gte('cobertura_hasta', from)
      .lt('cobertura_hasta', to)

    if (error) {
      console.error(`[coverage-reminder] DB error (${daysLeft}d):`, error.message)
      continue
    }

    for (const affiliate of affiliates ?? []) {
      await sendCoverageReminderEmail(
        affiliate.nombre,
        affiliate.email,
        formatDateAR(affiliate.cobertura_hasta),
        daysLeft,
      )
      results.push(`${affiliate.email} (${daysLeft}d)`)
    }
  }

  console.log('[coverage-reminder] Sent:', results)
  return NextResponse.json({ ok: true, sent: results.length, emails: results })
}
