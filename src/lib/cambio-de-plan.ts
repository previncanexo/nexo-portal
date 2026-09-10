/**
 * Reglas de negocio del cambio de plan (upgrade/downgrade) de un afiliado.
 *
 * ÚNICO LUGAR donde viven estas reglas — a propósito, para que Previnca pueda
 * confirmarlas o corregirlas leyendo un solo archivo, sin tener que rastrear
 * lógica repartida entre la UI, la server action y el webhook. Ese es también
 * el motivo de que este módulo sea SOLO funciones puras: nada de acceso a
 * Supabase, nada de `fetch`, nada de `'use client'` ni imports de React. Toda
 * la data que necesita (plan actual, plan destino, datos del afiliado) se la
 * pasa quien lo llama — la resolución de esos datos contra la base vive en la
 * server action de la tanda siguiente, no acá.
 *
 * Decisión de diseño ya tomada (no se reabre acá): el cambio de plan se aplica
 * recién en el PRÓXIMO CICLO DE FACTURACIÓN, no al instante. Ver el comentario
 * de cabecera de la migración `20260910000001_create_plan_changes.sql` para el
 * razonamiento completo (evitar prorrateos).
 */

import type { PlanSlug } from './planes-catalogo'
import type { AffiliateStatus } from './types'
import { todayAR } from './dateUtils'

/**
 * Edad máxima de incorporación por plan. Viene del documento de producto del
 * cliente: el Seguro de Salud I (incluido en Nexo II) dice "edad de
 * incorporación: hasta 59 años inclusive" y el Seguro de Salud II (en Nexo III)
 * "hasta 64 años". Nexo I no incluye seguro de salud, así que no tiene tope.
 *
 * PENDIENTE DE CONFIRMAR CON EL CLIENTE: se asume que el tope aplica también al
 * cambio de plan de un afiliado que ya está adentro, no sólo al alta. Es lo
 * conservador — la aseguradora podría no reconocer la cobertura a alguien que
 * la contrató pasada la edad — pero no está escrito en ningún lado.
 */
export const TOPES_EDAD: Record<PlanSlug, number | null> = {
  'nexo-1': null,
  'nexo-2': 59,
  'nexo-3': 64,
}

/**
 * Edad en años cumplidos a una fecha de referencia (`hoy`, formato YYYY-MM-DD;
 * por defecto `todayAR()`).
 *
 * Se parsean los componentes de la fecha a mano en lugar de instanciar `Date`
 * directamente sobre el string, siguiendo el mismo criterio que `dateUtils.ts`
 * (`todayAR`, `formatDateAR`): un `new Date('YYYY-MM-DD')` crudo se interpreta
 * como UTC medianoche, que en Argentina (UTC-3) puede correr la fecha un día
 * para atrás. Comparando año/mes/día como números no hay conversión de zona
 * horaria de por medio, así que el problema no existe.
 */
export function edadEnAnios(fechaNacimiento: string, hoy: string = todayAR()): number {
  const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number)
  const [anioHoy, mesHoy, diaHoy] = hoy.split('-').map(Number)

  let edad = anioHoy - anioNac
  const todaviaNoCumplioEsteAnio = mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac)
  if (todaviaNoCumplioEsteAnio) edad -= 1

  return edad
}

export type MotivoBloqueo =
  | 'mismo-plan'
  | 'plan-inactivo'
  | 'sin-fecha-nacimiento'
  | 'supera-edad'
  | 'afiliado-no-activo'
  | 'cambio-pendiente'
  | 'plan-desconocido'

/**
 * `TOPES_EDAD` está tipado por `PlanSlug`, pero el slug del plan destino llega
 * desde la base y se castea: TypeScript no puede garantizar en runtime que sea
 * uno de los tres conocidos. Si mañana alguien crea un cuarto plan desde
 * /admin/planes, `TOPES_EDAD[slug]` da `undefined`, y `undefined` NO es `null`
 * — con lo cual el chequeo de edad entraría, compararía contra `undefined`, daría
 * `NaN > undefined === false` y dejaría pasar a cualquiera sin validar la edad.
 *
 * En reglas de seguros lo desconocido tiene que BLOQUEAR, no habilitar. Este
 * guard convierte ese fail-open silencioso en un bloqueo explícito.
 */
function esSlugConocido(slug: string): slug is PlanSlug {
  return Object.prototype.hasOwnProperty.call(TOPES_EDAD, slug)
}

export interface ParametrosCambioDePlan {
  /** id del plan al que el afiliado quiere cambiarse. */
  planDestinoId: string
  /** slug del plan destino — determina el tope de edad vía `TOPES_EDAD`. */
  planDestinoSlug: PlanSlug
  /** `plans.is_active` del plan destino. Un plan desactivado no se puede contratar. */
  planDestinoActivo: boolean
  /** id del plan que tiene hoy el afiliado. `null` en el caso legacy sin plan resuelto. */
  planActualId: string | null
  fecha_nacimiento: string | null
  status: AffiliateStatus
  cancel_requested_at: string | null
  /** `true` si ya existe una fila en `plan_changes` con `status = 'pendiente'` para este afiliado. */
  tieneCambioPendiente: boolean
  /** Fecha de referencia para el cálculo de edad (YYYY-MM-DD). Default `todayAR()`; parametrizable para tests. */
  hoy?: string
}

export interface ResultadoPuedeCambiarA {
  permitido: boolean
  motivo?: MotivoBloqueo
  /** Texto listo para mostrarle al afiliado tal cual, en español rioplatense. Solo presente cuando `permitido` es `false`. */
  mensaje?: string
}

/**
 * Evalúa si un afiliado puede pedir el cambio a `planDestino`. Los checks se
 * evalúan EN ORDEN y se corta en el primero que bloquea — el orden importa
 * porque algunos motivos son más específicos que otros (p. ej. no tiene
 * sentido decir "superás la edad" de un plan que ni siquiera está activo).
 */
export function puedeCambiarA(params: ParametrosCambioDePlan): ResultadoPuedeCambiarA {
  const {
    planDestinoId,
    planDestinoSlug,
    planDestinoActivo,
    planActualId,
    fecha_nacimiento,
    status,
    cancel_requested_at,
    tieneCambioPendiente,
    hoy,
  } = params

  // 1. Ya está en ese plan — no hay nada que cambiar.
  if (planActualId !== null && planActualId === planDestinoId) {
    return {
      permitido: false,
      motivo: 'mismo-plan',
      mensaje: 'Ya estás en este plan.',
    }
  }

  // 2. El plan destino se dio de baja del catálogo (sigue existiendo la fila
  // porque los afiliados que ya lo tenían lo conservan, pero no se puede
  // contratar de nuevo).
  if (!planDestinoActivo) {
    return {
      permitido: false,
      motivo: 'plan-inactivo',
      mensaje: 'Este plan ya no está disponible para contratar.',
    }
  }

  // 3. Alguien en 'pending' todavía no pagó nada — no hay suscripción de
  // Mercado Pago activa sobre la que pedir un cambio de monto. Alguien que
  // pidió cancelar está de salida — dejarlo cambiar de plan reabre y enreda
  // una suscripción que ya se está cerrando.
  if (status !== 'active' || cancel_requested_at !== null) {
    if (cancel_requested_at !== null) {
      return {
        permitido: false,
        motivo: 'afiliado-no-activo',
        mensaje:
          'Ya pediste cancelar tu suscripción, así que no podemos cambiarte el plan. Si te arrepentiste, escribinos y lo resolvemos.',
      }
    }
    return {
      permitido: false,
      motivo: 'afiliado-no-activo',
      mensaje: 'Tu cuenta todavía no está activa, así que no podés cambiar de plan por el momento.',
    }
  }

  // 3.bis. Slug fuera de los tres conocidos: no sabemos qué tope de edad le
  // corresponde, así que no podemos afirmar que este afiliado califica. Ver
  // `esSlugConocido` para el fail-open que este guard evita.
  if (!esSlugConocido(planDestinoSlug)) {
    return {
      permitido: false,
      motivo: 'plan-desconocido',
      mensaje: 'No podemos procesar el cambio a este plan. Escribinos y lo resolvemos con vos.',
    }
  }

  const topeEdad = TOPES_EDAD[planDestinoSlug]

  // 4. Sin fecha de nacimiento no se puede verificar el tope de edad del plan
  // destino. Se BLOQUEA, no se asume que está dentro del tope: dejarlo pasar
  // significa venderle un seguro que la aseguradora después puede no reconocer.
  if (topeEdad !== null && !fecha_nacimiento) {
    return {
      permitido: false,
      motivo: 'sin-fecha-nacimiento',
      mensaje:
        'Para cambiarte a este plan necesitamos tu fecha de nacimiento. Actualizala en tu perfil y volvé a intentarlo.',
    }
  }

  // 5. Supera la edad de incorporación del plan destino.
  if (topeEdad !== null && fecha_nacimiento && edadEnAnios(fecha_nacimiento, hoy) > topeEdad) {
    return {
      permitido: false,
      motivo: 'supera-edad',
      mensaje: `Este plan admite incorporaciones hasta los ${topeEdad} años.`,
    }
  }

  // 6. Ya hay un cambio en curso — se espera a que se aplique (o se cancele)
  // antes de pedir uno nuevo.
  if (tieneCambioPendiente) {
    return {
      permitido: false,
      motivo: 'cambio-pendiente',
      mensaje: 'Ya tenés un cambio de plan en curso. Esperá a que se aplique antes de pedir otro.',
    }
  }

  return { permitido: true }
}

/** `true` si el plan nuevo cuesta más que el actual. Un mismo precio no es upgrade. */
export function esUpgrade(precioActual: number, precioNuevo: number): boolean {
  return precioNuevo > precioActual
}
