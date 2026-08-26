export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  mp_plan_id: string | null
  created_at: string
  updated_at: string
}

export interface Affiliate {
  id: string
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp: string | null
  ciudad: string | null
  domicilio: string | null
  fecha_nacimiento: string | null
  plan_id: string | null
  affiliate_number: string
  status: AffiliateStatus
  cobertura_desde: string | null
  cobertura_hasta: string | null
  user_id: string | null
  notes: string | null
  mp_subscription_id: string | null
  farmacia_number: string | null
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface Payment {
  id: string
  affiliate_id: string
  amount: number
  currency: string
  mp_status: string
  mp_payment_id: string | null
  paid_at: string | null
  period_from: string | null
  period_to: string | null
  created_at: string
  type: 'payment' | 'refund'
}

export interface ServiceConsumption {
  id: string
  affiliate_id: string
  service_type: string
  consumed_at: string
  notes: string | null
  created_at: string
}

/**
 * partial   → formulario incompleto
 * completed → formulario completo + checkout de MP generado, sin pagar
 * converted → pagó → tiene affiliate_id
 * abandoned → el cron lo dio por perdido
 */
export type LeadStatus = 'partial' | 'completed' | 'converted' | 'abandoned'

export interface Lead {
  id: string
  para_quien: 'para_mi' | 'otra_persona' | null
  nombre: string
  apellido: string
  email: string
  whatsapp: string | null
  dni: string | null
  fecha_nacimiento: string | null
  ciudad: string | null
  domicilio: string | null
  medio_pago: 'tarjeta' | 'mp_balance' | null
  mp_email: string | null
  plan_id: string | null
  status: LeadStatus
  affiliate_id: string | null
  // Trazabilidad de campaña (persistida por api/leads en la creación)
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referer: string | null
  // Trazabilidad técnica (persistida al finalizar stage 2 para el webhook MP)
  fbp: string | null
  fbc: string | null
  ga_client_id: string | null
  client_user_agent: string | null
  client_ip: string | null
  // Estado pre-pago: el checkout de MP vive en el lead hasta que el pago
  // aprobado materializa el afiliado.
  checkout_url: string | null
  mp_subscription_id: string | null
  mp_payer_id: string | null
  completed_at: string | null
  abandonment_notified_at: string | null
  rejection_notified_at: string | null
  created_at: string
}

export interface CreateAffiliatePayload {
  nombre: string
  apellido: string
  dni: string
  email: string
  whatsapp?: string
  ciudad?: string
  fecha_nacimiento?: string
  plan_id?: string
}

export interface CreateAffiliateResponse {
  affiliate_number: string
  temp_password: string
  email: string
}
