import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMonthlyActiveAffiliatesReport } from '@/lib/emails'

// Destinatario del reporte (equipo de liquidaciones de Rosario). Hardcoded
// porque hoy es un único mail. Si en el futuro hay que sumar destinatarios,
// mover a env var (ej: MONTHLY_REPORT_EMAILS) separados por coma.
const REPORT_RECIPIENT = 'cmorosario.liquidaciones@gmail.com'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

function periodLabel(): string {
  // AAAA-MM del mes anterior al día en que corre el cron (el cron dispara el
  // día 1, y el reporte es sobre "afiliados activos hoy" — la etiqueta usa
  // el mes previo para que quede claro "reporte de agosto emitido el 1° de
  // septiembre").
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

interface AffiliateRow {
  affiliate_number: string | null
  nombre: string
  apellido: string | null
  dni: string
  email: string
  whatsapp: string | null
  plan: { name: string } | { name: string }[] | null
  cobertura_desde: string | null
  cobertura_hasta: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Guard prod-only: en staging/preview este cron NO envía nada. Vercel expone
  // VERCEL_ENV = 'production' | 'preview' | 'development' según el deploy.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return NextResponse.json({
      ok: true,
      skipped: 'non-production',
      env: process.env.VERCEL_ENV,
      note: 'Este cron solo envía el reporte en producción. Está aclarado en el código y en vercel.json.',
    })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('affiliates')
    .select('affiliate_number, nombre, apellido, dni, email, whatsapp, plan:plans(name), cobertura_desde, cobertura_hasta, created_at')
    .eq('status', 'active')
    .order('affiliate_number', { ascending: true })

  if (error) {
    console.error('[monthly-report] DB error:', error.message)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as AffiliateRow[]

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Previnca Nexo'
  wb.created = new Date()
  const ws = wb.addWorksheet('Afiliados activos')
  ws.columns = [
    { header: 'N° afiliado', key: 'affiliate_number', width: 14 },
    { header: 'Nombre', key: 'nombre', width: 20 },
    { header: 'Apellido', key: 'apellido', width: 20 },
    { header: 'DNI', key: 'dni', width: 14 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'WhatsApp', key: 'whatsapp', width: 18 },
    { header: 'Plan', key: 'plan', width: 20 },
    { header: 'Cobertura desde', key: 'cobertura_desde', width: 16 },
    { header: 'Cobertura hasta', key: 'cobertura_hasta', width: 16 },
    { header: 'Alta', key: 'created_at', width: 18 },
  ]
  ws.getRow(1).font = { bold: true }

  for (const r of rows) {
    const planName = Array.isArray(r.plan) ? (r.plan[0]?.name ?? '') : (r.plan?.name ?? '')
    ws.addRow({
      affiliate_number: r.affiliate_number ?? '',
      nombre: r.nombre,
      apellido: r.apellido ?? '',
      dni: r.dni,
      email: r.email,
      whatsapp: r.whatsapp ?? '',
      plan: planName,
      cobertura_desde: r.cobertura_desde ?? '',
      cobertura_hasta: r.cobertura_hasta ?? '',
      created_at: r.created_at ? r.created_at.slice(0, 10) : '',
    })
  }

  const arrayBuffer = await wb.xlsx.writeBuffer()
  const xlsxBuffer = Buffer.from(arrayBuffer)

  const period = periodLabel()
  await sendMonthlyActiveAffiliatesReport({
    to: REPORT_RECIPIENT,
    periodLabel: period,
    totalActivos: rows.length,
    xlsxBuffer,
  })

  return NextResponse.json({
    ok: true,
    period,
    total: rows.length,
    to: REPORT_RECIPIENT,
  })
}
