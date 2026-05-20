import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH() {
  try {
    // Use server client (cookie-based) to verify session and sign out
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Use admin client to update status — bypasses RLS, guaranteed to work
    const admin = createAdminClient()
    const { error } = await admin
      .from('affiliates')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)

    if (error) {
      console.error('[cancel] DB error:', error.message)
      return NextResponse.json(
        { error: 'No se pudo cancelar la suscripción. Intentá de nuevo.' },
        { status: 500 }
      )
    }

    // Invalidate the user session
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancel] Unexpected error:', err)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
