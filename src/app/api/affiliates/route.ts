import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { CreateAffiliatePayload, CreateAffiliateResponse } from '@/lib/types'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    const body: CreateAffiliatePayload = await request.json()

    const { nombre, apellido, dni, email, whatsapp, ciudad, fecha_nacimiento, plan_id } = body

    if (!nombre || !apellido || !dni || !email) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, apellido, dni, email' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const tempPassword = generateTempPassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        { error: `Error creando usuario: ${authError.message}` },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Create affiliate record
    const affiliateData: Record<string, unknown> = {
      nombre,
      apellido,
      dni,
      email,
      user_id: userId,
      status: 'pending',
    }

    if (whatsapp) affiliateData.whatsapp = whatsapp
    if (ciudad) affiliateData.ciudad = ciudad
    if (fecha_nacimiento) affiliateData.fecha_nacimiento = fecha_nacimiento
    if (plan_id) affiliateData.plan_id = plan_id

    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .insert(affiliateData)
      .select('affiliate_number')
      .single()

    if (affiliateError) {
      // Rollback: delete auth user if affiliate insert failed
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Error creando afiliado: ${affiliateError.message}` },
        { status: 500 }
      )
    }

    const response: CreateAffiliateResponse = {
      affiliate_number: affiliate.affiliate_number,
      temp_password: tempPassword,
      email,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
