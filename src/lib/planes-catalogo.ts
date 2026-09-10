/**
 * Fuente única de verdad de QUÉ INCLUYE cada plan Nexo y qué se vende aparte.
 * La consumen dos contextos muy distintos — un client component (`ServiceCards.tsx`,
 * `RegistroForm.tsx`) y una route handler (`/api/planes`) — así que este archivo
 * NO puede llevar `'use client'` ni importar React. Es sólo datos + funciones puras.
 *
 * Espeja 1:1 la matriz comercial de la landing (`Nexo 2.0 V9/src/app/data/planes.ts`):
 * mismos `slug`, mismos `detalle` textuales. Esa landing es sólo copy de marketing;
 * ESTE archivo es la matriz operativa que consume el portal para decidir qué mostrarle
 * a cada afiliado según su plan real. Son dos audiencias y dos cadencias de cambio
 * distintas — por eso viven separadas y no como un único archivo compartido entre
 * repos.
 */

export type EstadoPrestacion = 'incluido' | 'coseguro' | 'no-incluido'
export type PlanSlug = 'nexo-1' | 'nexo-2' | 'nexo-3'

export interface PrestacionPlan {
  /** id de la card en ServiceCards.tsx (y key del mapa LABELS_SERVICIO más abajo). */
  servicioId: string
  estado: EstadoPrestacion
  /** Aclaración del coseguro: "1 consulta sin cargo · luego $18.000" */
  detalle?: string
}

/**
 * `no-incluido` es un estado EXPLÍCITO, igual que en la landing: se guarda para que
 * la matriz quede completa y auditable contra el documento de producto, aunque el
 * portal (a diferencia de la landing) nunca la renderice — ver `prestacionesDePlan`
 * y el filtro en `ServiceCards.tsx`, sección "Tu cobertura Nexo".
 */
export const PRESTACIONES_POR_PLAN: Record<PlanSlug, PrestacionPlan[]> = {
  'nexo-1': [
    { servicioId: 'urgencias', estado: 'incluido' },
    { servicioId: 'odontologia', estado: 'incluido' },
    { servicioId: 'farmacias', estado: 'incluido' },
    { servicioId: 'teleconsultas', estado: 'coseguro', detalle: '1 consulta sin cargo · luego $18.000' },
    { servicioId: 'psicologia', estado: 'coseguro', detalle: '1 sesión a $15.000 · luego $30.000' },
    // PENDIENTE (sin confirmar con el cliente): el documento de producto de Nexo I
    // NO lista Óptica entre sus prestaciones, pero sí la lista en Nexo II y III, que
    // son planes más baratos — probable omisión en el origen, no una decisión
    // deliberada. Se deja `incluido` a propósito para no quitarle a un afiliado
    // legacy (ver `prestacionesDePlan` más abajo) un beneficio que quizás sí tiene.
    // Cuando el cliente confirme: o se saca este comentario, o se pasa a
    // `no-incluido`. Mismo pendiente que documenta la landing en `data/planes.ts`.
    { servicioId: 'optica', estado: 'incluido', detalle: '1 par al año · Armazón y cristales de stock hasta 4.00 esf / 2.00 cil' },
  ],
  'nexo-2': [
    { servicioId: 'seguro-salud-1', estado: 'incluido', detalle: 'Alta complejidad, internación y trasplante' },
    { servicioId: 'farmacias', estado: 'incluido' },
    { servicioId: 'optica', estado: 'incluido', detalle: '1 par al año · Armazón y cristales de stock hasta 4.00 esf / 2.00 cil' },
    { servicioId: 'medico-a-domicilio', estado: 'coseguro', detalle: 'Consultas sin límite luego $30.000' },
    { servicioId: 'teleconsultas', estado: 'coseguro', detalle: '1 consulta sin cargo · luego $18.000' },
    { servicioId: 'psicologia', estado: 'coseguro', detalle: '1 sesión a $15.000 · luego $30.000' },
    { servicioId: 'urgencias', estado: 'no-incluido' },
    { servicioId: 'odontologia', estado: 'no-incluido' },
  ],
  'nexo-3': [
    { servicioId: 'seguro-salud-2', estado: 'incluido', detalle: 'Alta complejidad, enfermedades graves y rehabilitación' },
    { servicioId: 'optica', estado: 'incluido', detalle: '1 par al año · Armazón y cristales de stock hasta 4.00 esf / 2.00 cil' },
    // OJO: el copago de Doc24 en Nexo III es distinto al de Nexo I y II (aclaración
    // de Javier Talarn, ver landing `data/planes.ts`): acá cubre $10.000 y no "1
    // consulta sin cargo".
    { servicioId: 'teleconsultas', estado: 'coseguro', detalle: 'Cobertura de $10.000 · luego $18.000' },
    { servicioId: 'psicologia', estado: 'coseguro', detalle: '1 sesión a $15.000 · luego $30.000' },
    { servicioId: 'urgencias', estado: 'no-incluido' },
    { servicioId: 'odontologia', estado: 'no-incluido' },
    { servicioId: 'farmacias', estado: 'no-incluido' },
  ],
}

/**
 * Resuelve las prestaciones de un afiliado a partir del `slug` de su plan.
 *
 * Fallback legacy: el plan viejo ("Plan Base Nexo", renombrado a "Nexo I" y
 * desactivado por la migración `20260901000001_add_slug_and_nexo_plans.sql`) se
 * queda sin `slug` a propósito — ver el comentario de esa migración: "sin slug no
 * se puede contratar". Pero esos afiliados YA CONTRATARON, con la misma cobertura
 * que hoy es Nexo I (mismo nombre, mismo alcance, sólo cambió el precio: $19.500
 * legacy vs $20.000 Nexo I). Si acá se les negara cobertura por no tener slug, el
 * portal les mostraría "Tu cobertura Nexo" vacío pese a que pagan una cuota activa
 * — pagan una cuota activa y no verían nada de lo que compraron.
 *
 * Un `slug` desconocido (dato corrupto, plan borrado a mano) cae al mismo lado, y
 * eso NO es "mostrar de más por las dudas": mostrar cobertura que alguien no tiene
 * es exactamente el bug que este módulo vino a cerrar. Cae a `nexo-1` porque es la
 * cobertura que tenía la base legacy, que es el único caso real de slug ausente
 * que existe hoy. Ojo: `nexo-1` NO es el plan "más completo" — no incluye Seguro
 * de Salud I ni II, que sí traen Nexo II y III. Los tres planes son distintos, no
 * están anidados, así que ningún fallback es seguro por ser "el de arriba". Si
 * algún día aparecen slugs desconocidos de verdad, esto hay que revisarlo, no
 * ampliarlo.
 */
export function prestacionesDePlan(slug: string | null | undefined): PrestacionPlan[] {
  if (slug === 'nexo-1' || slug === 'nexo-2' || slug === 'nexo-3') {
    return PRESTACIONES_POR_PLAN[slug]
  }
  return PRESTACIONES_POR_PLAN['nexo-1']
}

export interface ServicioOnDemand {
  id: string
  nombre: string
  precio: number
}

/**
 * Servicios que se contratan y se pagan por fuera de la cuota.
 *
 * Los `id` son los de la LANDING (`Nexo 2.0 V9/src/app/data/planes.ts`, array
 * `ON_DEMAND`), no los de las cards del portal. La razón es que este array no lo
 * consume la UI: su único consumidor es `/api/planes`, y el único consumidor de
 * ese endpoint es el CI de la landing (`scripts/check-precios.mjs`), que matchea
 * por id textual. Usar los ids del portal obligaría a mantener una tabla de
 * traducción en algún lado, y esa tabla es justo el tipo de cosa que se
 * desincroniza en silencio — que es el problema que este chequeo vino a resolver.
 *
 * Ojo con `seguro-hogar`: en `ServiceCards.tsx` es UNA sola card con dos
 * variantes de precio adentro (`hasta_1er_piso` / `segundo_piso_plus`, ver
 * `seguro_hogar_solicitudes`), mientras que la landing las publica como dos
 * entradas separadas. Por eso acá hay dos y allá una — no es un error de copia.
 *
 * Si mañana la UI necesita este array, va a hacer falta agregar un campo aparte
 * con el id de la card; no renombrar estos, que son contrato público.
 */
export const ON_DEMAND: ServicioOnDemand[] = [
  { id: 'salud-1', nombre: 'Seguro de Salud I', precio: 6000 },
  { id: 'arbol-de-vida', nombre: 'Árbol de Vida', precio: 5000 },
  { id: 'hogar-1', nombre: 'Seguro de Hogar · hasta 1er piso', precio: 19000 },
  { id: 'hogar-2', nombre: 'Seguro de Hogar · 2do piso +', precio: 22000 },
  { id: 'vida', nombre: 'Seguro de Vida', precio: 2750 },
]

/**
 * Label + ícono (emoji, mismo estilo que ya usaba `RegistroForm.tsx` en su
 * `PLAN_BENEFITS` hardcodeado) por `servicioId`. Vive acá y no en `ServiceCards.tsx`
 * ni duplicado en `RegistroForm.tsx` porque los dos la necesitan: `ServiceCards`
 * ya tiene su propio copy largo (descripción, bullets, modal) por servicio, pero
 * el checklist corto de "beneficios del plan" que muestra `RegistroForm` en el
 * registro necesita solamente una etiqueta corta — este mapa es esa fuente única.
 */
export const LABELS_SERVICIO: Record<string, { label: string; icon: string }> = {
  teleconsultas: { label: 'Teleconsultas médicas: DOC 24', icon: '🩺' },
  urgencias: { label: 'Emergencias médicas', icon: '🚑' },
  odontologia: { label: 'Guardias odontológicas', icon: '🦷' },
  farmacias: { label: 'Descuentos en farmacias', icon: '💊' },
  optica: { label: 'Óptica: 1 par de anteojos por año', icon: '👓' },
  psicologia: { label: 'Psicología: sesiones con profesionales', icon: '🧠' },
  'medico-a-domicilio': { label: 'Médico a domicilio', icon: '🏠' },
  'seguro-salud-1': { label: 'Seguro de Salud I', icon: '🏥' },
  'seguro-salud-2': { label: 'Seguro de Salud II', icon: '🏥' },
}
