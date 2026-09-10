import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncMpPaymentsForAffiliate } from '@/lib/mpSync'
import type { Affiliate, Payment } from '@/lib/types'
import { puedeCambiarA } from '@/lib/cambio-de-plan'
import type { PlanSlug } from '@/lib/planes-catalogo'
import CredentialWithDownload from './CredentialWithDownload'
import ServiceCards from './ServiceCards'
import CancelSection from './CancelSection'
import ReactivateButton from './ReactivateButton'
import RetryPaymentButton from './RetryPaymentButton'
import ActiveWatcher from './ActiveWatcher'
import PlanActivo from './PlanActivo'
import CambiarPlan, { type OpcionPlan } from './CambiarPlan'

function getGreeting(): string {
  const hour = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours()
  if (hour >= 6 && hour < 13) return 'Buenos días'
  if (hour >= 13 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function PortalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  let { data: affiliate } = await supabase
    .from('affiliates')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <p className="text-base font-semibold">No encontramos tu afiliación.</p>
        <p className="text-sm" style={{ color: 'var(--texto-suave)' }}>
          Si creés que es un error, contactate con Nexo para resolver tu situación.
        </p>
      </div>
    )
  }

  const status = affiliate.status as 'pending' | 'active' | 'suspended' | 'cancelled'
  const isPending = status === 'pending'

  // Fallback lazy sync: si aparece sin cobertura vigente pero MP le sigue
  // cobrando (webhook perdido, subs viejas con plan template), consultamos MP
  // y registramos los pagos faltantes antes de renderizar el portal.
  const now = new Date()
  const preliminaryCoberturaHasta = affiliate.cobertura_hasta ? new Date(affiliate.cobertura_hasta + 'T23:59:59') : null
  const preliminaryVigente = !!preliminaryCoberturaHasta && preliminaryCoberturaHasta >= now

  if (!preliminaryVigente && !isPending && affiliate.mp_subscription_id) {
    const { synced } = await syncMpPaymentsForAffiliate(adminClient, {
      id: affiliate.id,
      mp_subscription_id: affiliate.mp_subscription_id,
      cobertura_hasta: affiliate.cobertura_hasta,
    })
    if (synced > 0) {
      const { data: refetched } = await supabase
        .from('affiliates')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .single()
      if (refetched) affiliate = refetched
    }
  }

  const firstName = affiliate.nombre
  const coberturaHasta = affiliate.cobertura_hasta ? new Date(affiliate.cobertura_hasta + 'T23:59:59') : null
  const coberturaVigente = !!coberturaHasta && coberturaHasta >= now
  // El acceso a servicios se abre por dos caminos independientes:
  //   1. status='active' — caso normal, sin depender de fecha.
  //   2. cobertura vigente por fecha — sostiene el acceso DESPUÉS de cancelar o
  //      de que MP suspenda, mientras dure lo pagado.
  // El segundo SUMA acceso; no lo condiciona. Escrito al revés (sólo fecha),
  // cualquier afiliado activo sin `cobertura_hasta` cargada perdía credencial.
  const tieneCobertura = status === 'active' || coberturaVigente
  const cancelRequested = !!affiliate.cancel_requested_at

  // Acá `status` ya sólo puede ser active, suspended o cancelled: el pending
  // devuelve antes su propia pantalla de pago. Así que quedarse sin cobertura
  // implica, por definición, estar en un estado terminal.
  const bloqueadoSinCobertura = !tieneCobertura

  const coberturaHastaLabel = coberturaHasta
    ? coberturaHasta.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  let payments: Payment[] = []
  // Único on-demand con estado de contratación persistido hoy: Seguro de Hogar
  // (`seguro_hogar_solicitudes`, RLS restringida a service_role → adminClient).
  // Los otros cuatro (Árbol de Vida, Psicología, Seguro de Salud I, Seguro de
  // Vida) no tienen tabla propia todavía — ver comentario de `onDemandActivos`
  // en ServiceCards.tsx. Se resuelve junto con `payments` en un solo
  // `Promise.all` para no agregar un round-trip serial a `adminClient`.
  let seguroHogarActivo = false
  // Planes activos disponibles para ofrecer en el cambio de plan (Tarea 3) y el
  // cambio pendiente, si lo hay (Tarea 1 lo crea, el webhook lo aplica). Se
  // resuelven en el mismo `Promise.all` que `payments` y `seguroHogarData` por
  // la misma razón que ese comentario ya explica: no agregar round-trips
  // seriales a `adminClient`.
  let planesActivos: { id: string; slug: string | null; name: string; price: number }[] = []
  let cambioPendienteNombre: string | null = null
  if (affiliate.id) {
    const [{ data: paymentsData }, { data: seguroHogarData }, { data: planesData }, { data: cambioPendienteData }] = await Promise.all([
      adminClient
        .from('payments')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(24),
      adminClient
        .from('seguro_hogar_solicitudes')
        .select('id')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'dado_de_alta')
        .limit(1),
      adminClient
        .from('plans')
        .select('id, slug, name, price')
        .eq('is_active', true)
        .order('price', { ascending: true }),
      adminClient
        .from('plan_changes')
        .select('to_plan:plans(name)')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'pendiente')
        .maybeSingle(),
    ])
    payments = (paymentsData ?? []) as Payment[]
    seguroHogarActivo = (seguroHogarData ?? []).length > 0
    planesActivos = planesData ?? []
    const rawToPlan = cambioPendienteData?.to_plan as any
    const toPlan = Array.isArray(rawToPlan) ? rawToPlan[0] : rawToPlan
    cambioPendienteNombre = toPlan?.name ?? null
  }

  // Evaluación de reglas del lado del servidor por cada plan candidato (Tarea 3,
  // último punto): `puedeCambiarA` es la ÚNICA fuente de verdad de estas reglas
  // (`cambio-de-plan.ts`), así que se evalúa acá y se le pasa el resultado ya
  // resuelto al client component — en vez de exponer la función y reevaluarla
  // en el browser con la fecha del dispositivo del afiliado, que no es
  // confiable para calcular una edad que bloquea o habilita una cobertura.
  const opcionesPlan: OpcionPlan[] = planesActivos
    .filter((plan) => plan.id !== affiliate.plan_id)
    .map((plan) => ({
      plan,
      evaluacion: puedeCambiarA({
        planDestinoId: plan.id,
        planDestinoSlug: plan.slug as PlanSlug,
        planDestinoActivo: true, // ya filtrado por is_active arriba
        planActualId: affiliate.plan_id,
        fecha_nacimiento: affiliate.fecha_nacimiento,
        status,
        cancel_requested_at: affiliate.cancel_requested_at,
        tieneCambioPendiente: !!cambioPendienteNombre,
      }),
    }))

  // Genérica a propósito: hoy sólo Seguro de Hogar puede poblarla (es el único
  // on-demand con modelo de datos de contratación), pero el contrato de
  // ServiceCards es "lista de servicioId contratados", no "estado de seguro de
  // hogar". Cuando Árbol de Vida, Psicología, Seguro de Salud I o Seguro de
  // Vida tengan su propia tabla, se agregan acá sin tocar ServiceCards.
  const onDemandActivos: string[] = seguroHogarActivo ? ['seguro-hogar'] : []

  // Pending: show focused payment screen instead of locked portal
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--alerta)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Completá tu pago
          </h1>
          <p className="text-sm sm:text-base max-w-sm" style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)' }}>
            Tu cuenta está registrada pero el pago no fue confirmado todavía. Completá el pago para activar todos tus beneficios.
          </p>
        </div>

        <RetryPaymentButton email={affiliate.email} />

        <a
          href="/registro"
          className="text-sm"
          style={{ color: 'var(--texto-tenue)', fontFamily: 'var(--font-dm-sans)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          Volver a registrarse con otros datos
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-9 pb-10">

      {/*
        Saludo en dos líneas del mismo tamaño, la primera en peso normal y la
        segunda en bold. Antes el "buenas tardes" era una mayúscula diminuta con
        letterspacing: se leía como una etiqueta de sistema y no como alguien
        saludándote. El nombre es lo único que cambia, así que es lo único que
        lleva el peso.
      */}
      <div>
        <p
          className="text-3xl sm:text-4xl leading-[1.15]"
          style={{ color: 'var(--texto-suave)', fontFamily: 'var(--font-dm-sans)', fontWeight: 400 }}
        >
          {getGreeting()}
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold leading-[1.15]"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {firstName} 👋
        </h1>
        <p className="text-[15px] sm:text-base mt-3" style={{ color: 'var(--texto-suave)' }}>
          Todos tus beneficios en un solo lugar.
        </p>
      </div>

      {coberturaVigente && cancelRequested && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--alerta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--alerta)' }}>
              Cancelaste tu suscripción
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(251,191,36,0.85)' }}>
              Seguís teniendo acceso a todos los beneficios hasta el <strong>{coberturaHastaLabel}</strong>. Después de esa fecha se dan de baja.
            </p>
            <ReactivateButton variant="ghost" />
          </div>
        </div>
      )}

      {bloqueadoSinCobertura && (
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)' }}
        >
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
              Tu cobertura finalizó
            </p>
            <p className="text-sm mt-0.5 mb-2" style={{ color: 'rgba(248,113,113,0.80)' }}>
              El período contratado ya venció. Reactivá tu suscripción para recuperar el acceso.
            </p>
            <ReactivateButton variant="primary" />
          </div>
        </div>
      )}

      {/* Plan activo: lo primero que el afiliado ve sobre SU plan — hoy ese dato
          sólo vivía chico, dentro del badge de la credencial (CredentialCard.tsx). */}
      {tieneCobertura && <PlanActivo affiliate={affiliate as Affiliate} />}

      {/* Credencial */}
      {tieneCobertura && (
        <section>
          <p
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Tu credencial
          </p>
          <CredentialWithDownload affiliate={affiliate as Affiliate} />
        </section>
      )}

      {/* Servicios */}
      {tieneCobertura ? (
        <ServiceCards affiliate={affiliate as Affiliate | null} onDemandActivos={onDemandActivos} />
      ) : (
        <section>
          <p
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--texto-fuerte)', fontFamily: 'var(--font-dm-sans)' }}
          >
            Tus servicios
          </p>
          <div className="glass-card px-5 py-6 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(251,191,36,0.1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--alerta)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-dm-sans)' }}>
                Servicios no disponibles
              </p>
              <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--gray-500)' }}>
                Tu cobertura finalizó. Contactanos para reactivarla.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Cambiar de plan: al final, junto a cancelar, y no arriba.
          Las dos son acciones de administración de la cuenta: excepcionales,
          deliberadas y de las que uno se arrepiente. Lo que el afiliado viene a
          hacer todos los días es usar su cobertura —credencial y servicios—, y
          eso tiene que quedar primero. Además, ofrecer "cambiate de plan" antes
          de mostrar lo que el plan incluye invita a decidir sin la información
          delante.

          Sólo con cobertura vigente: sin ella no hay suscripción de MP sobre la
          que cambiar el monto ni cobertura contra la cual comparar. */}
      {tieneCobertura && (
        <CambiarPlan
          affiliate={affiliate as Affiliate}
          opciones={opcionesPlan}
          cambioPendienteNombre={cambioPendienteNombre}
        />
      )}

      {/* Cancelar suscripción */}
      <CancelSection status={status} cancelRequested={cancelRequested} coberturaHastaLabel={coberturaHastaLabel} />

    </div>
  )
}
