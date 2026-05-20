import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { error } = await supabase
    .from('affiliates')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
