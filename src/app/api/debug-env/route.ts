import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminRaw = process.env.ADMIN_EMAILS ?? ''
  const adminEmails = adminRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

  return NextResponse.json({
    user_email: user?.email ?? null,
    ADMIN_EMAILS_set: adminRaw.length > 0,
    ADMIN_EMAILS_count: adminEmails.length,
    is_admin: adminEmails.includes(user?.email?.toLowerCase() ?? ''),
  })
}
