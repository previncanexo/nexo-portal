/**
 * PATCH /api/leads/[id]/enrich
 *
 * Enriquecimiento progresivo del lead durante el onboarding (steps 3, 4 y 5).
 * NO crea preapproval MP ni cambia `status` — solo persiste los campos que
 * vienen en el body y dispara SF `/leads` con el estado actual del prospecto.
 *
 * El finalizador (`PATCH /api/leads/[id]`) sigue siendo el que crea la
 * preapproval, marca `status='completed'` y devuelve el `checkoutUrl`.
 *
 * Progressive profiling: cada envío reusa el `sf_lead_id` guardado en envíos
 * previos para que SF haga merge sobre el mismo Prospecto.
 */

import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { corsHeaders, jsonWithCors } from '@/lib/cors'
import { buildLeadIntakeBody, sendLeadIntake, getSfLeadIdForLead, type SalesChannel, type DocumentType } from '@/lib/salesforce/leads'

interface EnrichLeadInput {
  dni?: string
  fecha_nacimiento?: string
  ciudad?: string
  calle?: string
  numero?: string
  depto?: string
  codigo_postal?: string
  email?: string
  mp_email?: string
  // Constantes del canal (opcionales — SF_NEXO_DEFAULTS los defaultea)
  sales_channel?: string
  document_type?: string
  country?: string
  state?: string
  declared_members_count?: number
  senior_members_count?: number
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get('origin')
  const { id: leadId } = await params

  let body: EnrichLeadInput
  try {
    body = await req.json()
  } catch {
    return jsonWithCors({ success: false, error: 'Body inválido' }, { status: 400, origin })
  }

  const supabase = createAdminClient()

  // 1. Verificar que el lead exista y no esté ya convertido
  const { data: lead, error: leadFetchError } = await supabase
    .from('leads')
    .select('id, status, nombre, apellido, email, whatsapp, dni, fecha_nacimiento, ciudad, domicilio, codigo_postal')
    .eq('id', leadId)
    .maybeSingle()

  if (leadFetchError || !lead) {
    return jsonWithCors(
      { success: false, error: 'lead_not_found' },
      { status: 404, origin }
    )
  }
  if (lead.status === 'converted') {
    return jsonWithCors(
      { success: false, error: 'already_converted' },
      { status: 409, origin }
    )
  }

  // 2. Persistir lo que venga (no pisar con undefined)
  const bodyEmailLower = body.email ? body.email.trim().toLowerCase() : null
  const finalEmail = bodyEmailLower || lead.email
  const domicilio = body.calle && body.numero
    ? [body.calle.trim(), body.numero.trim(), body.depto?.trim() ? `Dpto. ${body.depto.trim()}` : ''].filter(Boolean).join(' ')
    : lead.domicilio

  const patch: Record<string, unknown> = {}
  if (body.dni) patch.dni = body.dni.trim()
  if (body.fecha_nacimiento) patch.fecha_nacimiento = body.fecha_nacimiento
  if (body.ciudad) patch.ciudad = body.ciudad
  if (body.codigo_postal) patch.codigo_postal = body.codigo_postal.trim()
  if (domicilio && domicilio !== lead.domicilio) patch.domicilio = domicilio
  if (bodyEmailLower) patch.email = bodyEmailLower
  if (body.mp_email) patch.mp_email = body.mp_email.trim()

  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await supabase.from('leads').update(patch).eq('id', leadId)
    if (updateError) {
      console.error('[api/leads/enrich] update error:', updateError)
      return jsonWithCors(
        { success: false, error: 'db_error' },
        { status: 500, origin }
      )
    }
  }

  // 3. Preparar el snapshot con lo que quedó después del update
  const currentDni = (patch.dni as string | undefined) ?? lead.dni ?? null
  const currentBirthdate = (patch.fecha_nacimiento as string | undefined) ?? lead.fecha_nacimiento ?? null
  const currentCiudad = (patch.ciudad as string | undefined) ?? lead.ciudad ?? null
  const currentDomicilio = (patch.domicilio as string | undefined) ?? lead.domicilio ?? null
  const currentPostalCode = (patch.codigo_postal as string | undefined) ?? lead.codigo_postal ?? null

  // 4. SF /leads solo si ya tenemos DNI (SF exige documentType+documentNumber
  //    como clave de reconocimiento; sin DNI el envío rebota con 400).
  if (currentDni) {
    after(async () => {
      try {
        const sfLeadId = await getSfLeadIdForLead(leadId)
        const payload = buildLeadIntakeBody({
          sfLeadId,
          firstName: lead.nombre,
          lastName: lead.apellido ?? '',
          email: finalEmail,
          mobilePhone: lead.whatsapp ?? null,
          documentNumber: currentDni,
          birthdate: currentBirthdate,
          address: currentDomicilio || currentCiudad || currentPostalCode ? {
            street: currentDomicilio,
            city: currentCiudad,
            apartment: body.depto?.trim() || null,
            postalCode: currentPostalCode,
          } : undefined,
          salesChannel: body.sales_channel as SalesChannel | undefined,
          documentType: body.document_type as DocumentType | undefined,
          declaredMembersCount: body.declared_members_count,
          seniorMembersCount: body.senior_members_count,
        })
        await sendLeadIntake({ leadId, payload })
      } catch (err) {
        console.error('[sf/leads enrich] error', err)
      }
    })
  }

  return jsonWithCors({ success: true, leadId }, { status: 200, origin })
}
