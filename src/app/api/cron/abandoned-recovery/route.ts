import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendAbandonedFormEmail,
  sendAbandonedPaymentEmail,
  sendInternalAbandonedEmail,
} from '@/lib/emails'

// Vercel envía Authorization: Bearer <CRON_SECRET> automáticamente.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // permitir en dev sin secret
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const results = { form: 0, payment: 0 }

  // ---- Pasada 1: abandono de FORMULARIO (leads partial de +1h) ----
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('id, nombre, apellido, email, whatsapp')
    .eq('status', 'partial')
    .lt('created_at', oneHourAgo)

  if (leadsErr) {
    console.error('[abandoned-recovery] leads error:', leadsErr.message)
  } else {
    for (const lead of leads ?? []) {
      await sendAbandonedFormEmail({ nombre: lead.nombre, email: lead.email })
      await sendInternalAbandonedEmail({
        nombre: lead.nombre,
        apellido: lead.apellido ?? null,
        email: lead.email,
        whatsapp: lead.whatsapp ?? null,
        etapa: 'formulario',
        adminPath: '/admin/leads',
      })
      const { error: leadUpdErr } = await supabase.from('leads').update({ status: 'abandoned' }).eq('id', lead.id)
      if (leadUpdErr) {
        console.error('[abandoned-recovery] no se pudo marcar lead abandoned', lead.id, leadUpdErr.message)
        continue // no contar como procesado; la próxima corrida reintenta
      }
      results.form++
    }
  }

  // ---- Pasada 2: abandono de PAGO (affiliates pending de +1h, con checkout_url) ----
  const { data: affiliates, error: affErr } = await supabase
    .from('affiliates')
    .select('id, nombre, apellido, email, whatsapp, checkout_url')
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo)
    .is('abandonment_notified_at', null)
    .not('checkout_url', 'is', null)

  if (affErr) {
    console.error('[abandoned-recovery] affiliates error:', affErr.message)
  } else {
    for (const aff of affiliates ?? []) {
      const { error: updateErr } = await supabase
        .from('affiliates')
        .update({ abandonment_notified_at: new Date().toISOString() })
        .eq('id', aff.id)
      if (updateErr) {
        console.error('[abandoned-recovery] no se pudo marcar abandonment_notified_at para', aff.id, updateErr.message)
        continue // no enviar; se reintenta en la próxima corrida
      }
      await sendAbandonedPaymentEmail({
        nombre: aff.nombre,
        email: aff.email,
        checkoutUrl: aff.checkout_url as string,
      })
      await sendInternalAbandonedEmail({
        nombre: aff.nombre,
        apellido: aff.apellido ?? null,
        email: aff.email,
        whatsapp: aff.whatsapp ?? null,
        etapa: 'pago',
        adminPath: `/admin/afiliados/${aff.id}`,
      })
      results.payment++
    }
  }

  console.log('[abandoned-recovery] sent:', results)
  return NextResponse.json({ ok: true, ...results })
}
