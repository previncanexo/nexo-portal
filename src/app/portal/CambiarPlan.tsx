'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Affiliate } from '@/lib/types'
import type { MotivoBloqueo } from '@/lib/cambio-de-plan'
import { prestacionesDePlan, LABELS_SERVICIO } from '@/lib/planes-catalogo'
import { cambiarPlan } from './actions'

/**
 * Resultado de evaluar `puedeCambiarA` para un plan candidato. Se calcula del
 * lado del SERVIDOR (ver `src/app/portal/page.tsx`) y se le pasa ya resuelto a
 * este componente — no se reevalúa acá. La razón: el tope de edad depende de
 * `edadEnAnios(fecha_nacimiento, hoy)`, y `hoy` no puede salir del reloj del
 * dispositivo del afiliado para una decisión que bloquea o habilita una
 * cobertura médica. El servidor ya tiene la fecha de nacimiento real (no viaja
 * acá por privacidad) y la fecha de hoy confiable; el cliente sólo necesita el
 * veredicto.
 */
export interface OpcionPlan {
  plan: { id: string; slug: string | null; name: string; price: number }
  evaluacion: { permitido: boolean; motivo?: MotivoBloqueo; mensaje?: string }
}

interface CambiarPlanProps {
  affiliate: Affiliate
  opciones: OpcionPlan[]
  /** Nombre del plan destino si ya hay un cambio `pendiente` registrado. `null` si no hay ninguno. */
  cambioPendienteNombre: string | null
}

/** Separador de miles — mismo criterio (y misma razón) que `PlanActivo.tsx`. */
function formatearMiles(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

interface DiffPrestaciones {
  ganas: string[]
  perdes: string[]
}

/**
 * Compara lo que el afiliado tiene hoy contra lo que tendría con `destinoSlug`.
 * "Tener" un servicio es `incluido` o `coseguro` (paga una parte, pero lo
 * tiene) — mismo criterio que ya usa `PlanActivo.tsx` para contar prestaciones.
 * `no-incluido` es un estado explícito de la matriz que nunca cuenta como
 * "tenerlo", en ningún lado.
 */
function diffPrestaciones(actualSlug: string | null | undefined, destinoSlug: string | null): DiffPrestaciones {
  const actual = prestacionesDePlan(actualSlug)
  const destino = prestacionesDePlan(destinoSlug)

  const tieneEnActual = new Map(actual.map((p) => [p.servicioId, p.estado === 'incluido' || p.estado === 'coseguro']))
  const tieneEnDestino = new Map(destino.map((p) => [p.servicioId, p.estado === 'incluido' || p.estado === 'coseguro']))

  const todosLosIds = new Set([...tieneEnActual.keys(), ...tieneEnDestino.keys()])

  const ganas: string[] = []
  const perdes: string[] = []
  for (const id of todosLosIds) {
    const enActual = tieneEnActual.get(id) ?? false
    const enDestino = tieneEnDestino.get(id) ?? false
    if (!enActual && enDestino) ganas.push(id)
    if (enActual && !enDestino) perdes.push(id)
  }
  return { ganas, perdes }
}

function labelServicio(servicioId: string): string {
  return LABELS_SERVICIO[servicioId]?.label ?? servicioId
}

export default function CambiarPlan({ affiliate, opciones, cambioPendienteNombre }: CambiarPlanProps) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState<OpcionPlan | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)

  // Cambio en curso: no se ofrece el selector. "Cancelar el cambio" no está
  // implementado todavía (a propósito, ver la tarea que armó este componente),
  // así que no se sugiere esa opción para no prometer algo que no existe.
  if (cambioPendienteNombre) {
    return (
      <section>
        <p className="text-lg font-bold mb-4" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
          Cambio de plan
        </p>
        <div
          className="glass-card rounded-2xl px-5 py-5 flex items-start gap-3"
          style={{ background: 'rgba(134,96,239,0.08)', border: '1px solid rgba(134,96,239,0.22)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--acento)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
              Ya pediste cambiarte al plan {cambioPendienteNombre}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)' }}>
              El cambio se aplica en tu próximo período de facturación, cuando se acredite el pago con el nuevo monto. Tu cobertura actual sigue vigente hasta entonces.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (opciones.length === 0) return null

  async function handleConfirmar() {
    if (!confirmando) return
    setLoadingPlanId(confirmando.plan.id)
    setResultado(null)
    try {
      const res = await cambiarPlan(confirmando.plan.id)
      setResultado({ ok: res.ok, mensaje: res.mensaje })
      if (res.ok) {
        setConfirmando(null)
        router.refresh()
      }
    } catch {
      setResultado({ ok: false, mensaje: 'Error inesperado. Intentá de nuevo.' })
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <section>
      <p className="text-lg font-bold mb-4" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
        Cambiar de plan
      </p>

      {resultado && !confirmando && (
        <div
          className="rounded-2xl px-4 py-4 mb-4"
          style={{
            background: resultado.ok ? 'var(--ok-suave)' : 'var(--error-suave)',
            border: `1px solid ${resultado.ok ? 'var(--ok)' : 'var(--error)'}`,
          }}
        >
          <p className="text-sm font-medium" style={{ color: resultado.ok ? 'var(--ok)' : 'var(--error)', fontFamily: 'var(--font-dm-sans)' }}>
            {resultado.mensaje}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {opciones.map(({ plan, evaluacion }) => {
          const { ganas, perdes } = diffPrestaciones(affiliate.plan?.slug, plan.slug)
          const bloqueado = !evaluacion.permitido

          return (
            <div
              key={plan.id}
              className="glass-card rounded-2xl px-5 py-5"
              style={{ opacity: bloqueado ? 0.65 : 1 }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-base font-bold" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
                    {plan.name}
                  </p>
                  <p className="text-xl font-extrabold mt-0.5" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
                    ${formatearMiles(plan.price)} <span className="text-xs font-medium" style={{ color: 'var(--texto-tenue)' }}>por mes</span>
                  </p>
                </div>

                <button
                  onClick={() => { setConfirmando({ plan, evaluacion }); setResultado(null) }}
                  disabled={bloqueado || loadingPlanId !== null}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: bloqueado ? 'rgba(0,0,0,0.05)' : 'var(--acento-suave)',
                    border: `1px solid ${bloqueado ? 'rgba(0,0,0,0.08)' : 'var(--acento-borde)'}`,
                    color: bloqueado ? 'var(--texto-tenue)' : 'var(--acento-texto)',
                    cursor: bloqueado || loadingPlanId !== null ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {bloqueado ? 'No disponible' : 'Cambiar a este plan'}
                </button>
              </div>

              {/* Motivo del bloqueo VISIBLE, no ausente — alguien de 62 tiene que
                  entender por qué no puede pasarse a Nexo II, no sólo ver el
                  botón deshabilitado. */}
              {bloqueado && evaluacion.mensaje && (
                <p
                  className="text-xs mt-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--alerta-suave)', color: 'var(--alerta)', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {evaluacion.mensaje}
                </p>
              )}

              {(ganas.length > 0 || perdes.length > 0) && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {ganas.map((id) => (
                    <p key={`gana-${id}`} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--ok)', fontFamily: 'var(--font-dm-sans)' }}>
                      <span>+</span> Sumás {labelServicio(id)}
                    </p>
                  ))}
                  {perdes.map((id) => (
                    <p key={`pierde-${id}`} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--error)', fontFamily: 'var(--font-dm-sans)' }}>
                      <span>−</span> Perdés {labelServicio(id)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmación previa obligatoria: plata + cobertura médica no se
          cambian de un clic accidental. Repite ganás/perdés/precio/cuándo
          aplica antes de ejecutar nada. */}
      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
          onClick={() => loadingPlanId === null && setConfirmando(null)}
        >
          <div className="glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base sm:text-lg font-bold text-center mb-1" style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}>
              ¿Cambiar a {confirmando.plan.name}?
            </h3>
            <p className="text-sm text-center mb-4" style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)' }}>
              Vas a pagar <strong>${formatearMiles(confirmando.plan.price)}</strong> por mes. El cambio se aplica en tu <strong>próximo período de facturación</strong>, cuando se acredite el pago con el nuevo monto — tu cobertura actual sigue igual hasta entonces.
            </p>

            {(() => {
              const { ganas, perdes } = diffPrestaciones(affiliate.plan?.slug, confirmando.plan.slug)
              if (ganas.length === 0 && perdes.length === 0) return null
              return (
                <div className="mb-4 flex flex-col gap-1.5">
                  {ganas.map((id) => (
                    <p key={`c-gana-${id}`} className="text-sm flex items-center gap-1.5" style={{ color: 'var(--ok)', fontFamily: 'var(--font-dm-sans)' }}>
                      <span>+</span> Sumás {labelServicio(id)}
                    </p>
                  ))}
                  {perdes.map((id) => (
                    <p key={`c-pierde-${id}`} className="text-sm flex items-center gap-1.5" style={{ color: 'var(--error)', fontFamily: 'var(--font-dm-sans)' }}>
                      <span>−</span> Perdés {labelServicio(id)}
                    </p>
                  ))}
                </div>
              )
            })()}

            {resultado && !resultado.ok && (
              <div
                className="text-sm px-4 py-3 rounded-xl mb-4"
                style={{ background: 'var(--error-suave)', border: '1px solid var(--error)', color: 'var(--error)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {resultado.mensaje}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmar}
                disabled={loadingPlanId !== null}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-bold transition-all"
                style={{
                  background: 'var(--acento-suave)',
                  border: '1px solid var(--acento-borde)',
                  color: 'var(--acento-texto)',
                  opacity: loadingPlanId !== null ? 0.55 : 1,
                  cursor: loadingPlanId !== null ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {loadingPlanId !== null ? 'Procesando...' : 'Sí, confirmar el cambio'}
              </button>
              <button
                onClick={() => setConfirmando(null)}
                disabled={loadingPlanId !== null}
                className="w-full py-3 min-h-[44px] rounded-full text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  color: 'var(--texto-suave)',
                  cursor: loadingPlanId !== null ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
