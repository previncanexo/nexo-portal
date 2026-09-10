import type { Affiliate } from '@/lib/types'
import { prestacionesDePlan } from '@/lib/planes-catalogo'

interface PlanActivoProps {
  affiliate: Affiliate
}

/**
 * Separador de miles sin `toLocaleString`.
 *
 * Aclaración para no confundir al próximo que lea esto: hoy este archivo es un
 * Server Component (no lleva `'use client'`), su salida se serializa y NO se
 * vuelve a ejecutar en el browser, así que acá no hay riesgo de mismatch de
 * hidratación — ese problema aplica a los componentes de cliente. La razón real
 * de no usar `toLocaleString('es-AR')` es que su resultado depende de los datos
 * ICU del runtime que lo ejecute, y este precio es plata que el afiliado
 * compara contra lo que le cobran: tiene que verse igual en todos lados,
 * siempre, sin depender de con qué build de Node se haya renderizado. El regex
 * no depende de ningún locale. Como efecto secundario, si algún día esto pasa a
 * ser client component, no hay nada que revisar.
 *
 * Mismo criterio que usa la landing en `Nexo 2.0 V9/src/app/data/planes.ts`
 * (`formatearMiles`) — se replica acá en vez de importar entre repos porque son
 * dos codebases separadas sin dependencia compartida.
 */
function formatearMiles(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Nombre a mostrar para el plan activo del afiliado.
 *
 * Caso legacy: el plan viejo se llama "Previnca Nexo (legacy)" en la base y
 * tiene `slug = null` (ver el comentario de `prestacionesDePlan` en
 * `planes-catalogo.ts`). "legacy" es jerga interna para distinguir el plan en
 * el admin — el afiliado no tiene por qué leerla, y mostrarle "Tenés activo
 * el plan Previnca Nexo (legacy)" comunica algo que no le corresponde saber
 * (ni siquiera es cierto que su cobertura sea "vieja": tiene el mismo alcance
 * que Nexo I hoy). Se pela el sufijo entre paréntesis en vez de inventar un
 * nombre comercial nuevo, porque "Previnca Nexo" es el nombre real de su
 * plan, sólo que con una anotación interna pegada al lado.
 */
function nombrePlanVisible(nombre: string): string {
  return nombre.replace(/\s*\(legacy\)\s*$/i, '').trim()
}

export default function PlanActivo({ affiliate }: PlanActivoProps) {
  const plan = affiliate.plan
  if (!plan) return null

  const nombre = nombrePlanVisible(plan.name)

  // Mismo criterio de conteo que usa "Tu cobertura Nexo" en ServiceCards.tsx:
  // lo que el afiliado ya tiene es `incluido` + `coseguro` (paga una parte,
  // pero lo tiene). `no-incluido` es un estado explícito de la matriz que
  // nunca se le muestra al afiliado, así que tampoco cuenta acá.
  const cantidadPrestaciones = prestacionesDePlan(plan.slug).filter(
    (p) => p.estado === 'incluido' || p.estado === 'coseguro'
  ).length

  return (
    <div
      className="glass-card rounded-2xl px-5 py-5 sm:px-6 sm:py-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(134,96,239,0.14) 0%, rgba(238,92,208,0.08) 100%)',
        border: '1px solid rgba(134,96,239,0.25)',
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1.5"
            style={{ color: 'var(--texto-tenue)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Tu plan
          </p>
          <p
            className="text-xl sm:text-2xl font-bold leading-tight"
            style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Tenés activo el plan {nombre}
          </p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)' }}>
            Incluye {cantidadPrestaciones} prestaciones de tu cobertura Nexo.
          </p>
        </div>

        <div className="text-right shrink-0">
          <p
            className="text-2xl sm:text-3xl font-extrabold leading-none"
            style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}
          >
            ${formatearMiles(plan.price)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--texto-tenue)', fontFamily: 'var(--font-dm-sans)' }}>
            por mes
          </p>
        </div>
      </div>
    </div>
  )
}
