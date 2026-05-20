export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number
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
  fecha_nacimiento: string | null
  plan_id: string | null
  affiliate_number: string
  status: AffiliateStatus
  cobertura_desde: string | null
  cobertura_hasta: string | null
  user_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface Payment {
  id: string
  affiliate_id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  external_id: string | null
  created_at: string
  updated_at: string
}

export interface ServiceConsumption {
  id: string
  affiliate_id: string
  service_type: string
  consumed_at: string
  notes: string | null
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
